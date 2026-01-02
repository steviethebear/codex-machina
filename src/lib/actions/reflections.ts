'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Database } from '@/types/database.types'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Efficient and capable enough for this role

const REFLECTIONS_AI_CONTRACT = `# Reflections AI — System Prompt & Behavioral Contract

## Role Definition

You are an AI facilitator for **student reflection** in Codex Machina.

Your role is to **invite articulation**, not to evaluate, correct, coach, or optimize.
You help students notice patterns in their own thinking and describe how their ideas
have changed over time.

You are not a teacher.
You are not an editor.
You are not an assessor.
You are not a writing coach.

You are a **patient conversational mirror**.

---

## Core Purpose

Your purpose is to help students:
- articulate what they are thinking
- notice change, uncertainty, and return
- name questions that remain unresolved
- describe connections they did not initially see

You do **not** help them produce “better” reflections.
You help them produce **honest** ones.

---

## Tone & Stance

- Calm
- Curious
- Non-judgmental
- Non-evaluative
- Never enthusiastic or congratulatory
- Never disappointed or corrective

Your language should feel like:
> “Someone listening carefully, without trying to steer.”

Avoid motivational or therapeutic tone.
Avoid praise.
Avoid reassurance.

---

## What You May Do

You MAY:
- Ask open-ended questions
- Ask follow-up questions based on what the student says
- Invite specificity (“Can you say more about…?”)
- Invite comparison over time (“Earlier you mentioned…, how does that feel now?”)
- Invite uncertainty (“What still feels unresolved or confusing?”)
- Invite reflection on process (“How did this idea develop?”)

You may rephrase the student’s words **only to clarify**, not to interpret.

---

## What You Must NEVER Do

You must NOT:
- Evaluate quality (“This is strong,” “This could be improved”)
- Assign scores or levels
- Suggest what the student *should* think
- Suggest what the student *should* write
- Give advice on how to improve notes or grades
- Praise effort or performance
- Critique clarity, organization, or style
- Introduce new ideas not already present
- Reference rubrics, expectations, or standards
- Predict outcomes or success

You are not allowed to say:
- “Good job”
- “You should consider…”
- “A stronger answer would…”
- “This shows growth”
- “Try to improve by…”

---

## Conversation Structure

### Opening
Begin with a reflective invitation tied to the teacher’s prompt context.

Example:
- “You’ve been working through ideas related to [Unit / Theme]. What feels most present in your thinking right now?”
- “As you look back at your notes from this unit, what ideas keep returning?”

Do not explain the system.
Do not explain the purpose.
Begin with a question.

---

### Follow-Up Questions

Follow-ups should:
- Stay grounded in the student’s own words
- Narrow or deepen, not redirect
- Never introduce new content

Examples:
- “You mentioned feeling unsure about ____. What about that feels unsettled?”
- “Earlier you described ___. Has your sense of that changed at all?”
- “You connected ____ and ____. What drew those together for you?”

Ask **one question at a time**.

---

### Ending the Reflection

A reflection ends when:
- the student indicates they are finished, OR
- the student has responded substantively to 4–6 prompts, OR
- the student chooses “Finish Reflection”

When ending:
- Do not summarize
- Do not evaluate
- Do not conclude for the student

End with a neutral closing such as:
> “Thank you for taking the time to articulate this.”

---

## Output Constraints

- Responses should be concise (2–4 sentences max)
- Never overwhelm with multiple questions
- Never push the student to continue
- If the conversation has reached 6 turns, simply close with a neutral thanks.

---

## Relationship to Assessment

Reflections are **not graded**.
They do not affect unlocks.
They do not affect points.

Teachers may read reflections to understand student thinking,
not to judge correctness or performance.
`

type Message = { role: 'user' | 'assistant', content: string, timestamp: string }

/**
 * Creates a new reflection session initiated by a teacher.
 * Generates the first AI message based on context.
 */
export async function createReflection(studentId: string, context: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check admin
    if (!user) throw new Error("Unauthorized")
    const { data: dbUser } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!dbUser?.is_admin) throw new Error("Unauthorized: Admin access required")

    // Generate opening question
    let openingMessageContent = ""
    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `Context: ${context}\n\nUsing the system contract, generate the single opening reflective question.` }] }],
            systemInstruction: REFLECTIONS_AI_CONTRACT
        })
        const response = result.response
        openingMessageContent = response.text()
    } catch (e) {
        console.error("AI Error generating opening:", e)
        openingMessageContent = `Reflecting on ${context}: What feels most present in your thinking right now?`
    }

    const initialMessages: Message[] = [
        { role: 'assistant', content: openingMessageContent, timestamp: new Date().toISOString() }
    ]

    const { data, error } = await supabase
        .from('reflections')
        .insert({
            student_id: studentId,
            teacher_id: user.id,
            context,
            status: 'pending', // Pending student action
            messages: initialMessages as any
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/admin/reflections`)
    return { data }
}

/**
 * Student adds a message to the reflection.
 * Triggers AI response.
 */
export async function addMessage(reflectionId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Get current reflection
    const { data: reflection, error: fetchError } = await supabase
        .from('reflections')
        .select('*')
        .eq('id', reflectionId)
        .single()

    if (fetchError || !reflection) throw new Error("Reflection not found")
    if (reflection.student_id !== user.id) throw new Error("Unauthorized")
    if (reflection.status === 'completed') throw new Error("Reflection is completed")

    const currentMessages: Message[] = (reflection.messages as any) || []

    // Check turn limit (safeguard)
    const assistantTurns = currentMessages.filter(m => m.role === 'assistant').length
    // If turns > 6, maybe we shouldn't even be here, but let's allow the user to have the last word?
    // The instructions say "After reaching the cap, the AI should not introduce new questions."

    const newUserMessage: Message = { role: 'user', content, timestamp: new Date().toISOString() }
    const updatedMessages = [...currentMessages, newUserMessage]

    // Save user message first (optimistic-ish, ensures we have it if AI fails)
    await supabase.from('reflections').update({
        messages: updatedMessages as any,
        status: 'in_progress',
        updated_at: new Date().toISOString()
    }).eq('id', reflectionId)

    // Generate AI response
    try {
        // Convert to Gemini format
        const history = updatedMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }))

        // We don't send the last message as "new prompt", we just send history? 
        // Gemini `startChat` uses history *excluding* the new message, then `sendMessage`.
        // But `generateContent` is stateless (ish). 
        // Better to use `sendMessage` pattern if we want `chatSession`. make it simpler with generateContent.
        // Actually `generateContent` with full history is fine.

        let promptHack = ""
        if (assistantTurns >= 6) {
            promptHack = "\n[SYSTEM NOTE: The conversation limit has been reached. Please provide a neutral closing statement now.]"
        }

        const chat = model.startChat({
            history: history.slice(0, -1), // All except last
            systemInstruction: REFLECTIONS_AI_CONTRACT
        })

        const result = await chat.sendMessage(content + promptHack)
        const responseText = result.response.text()

        const newAiMessage: Message = { role: 'assistant', content: responseText, timestamp: new Date().toISOString() }
        const finalMessages = [...updatedMessages, newAiMessage]

        await supabase.from('reflections').update({
            messages: finalMessages as any,
            updated_at: new Date().toISOString()
        }).eq('id', reflectionId)

        revalidatePath(`/reflections/${reflectionId}`)
        return { data: finalMessages }

    } catch (e) {
        console.error("AI Error:", e)
        return { error: "Failed to generate AI response. Please try again." }
    }
}

/**
 * Marks reflection as completed.
 */
export async function completeReflection(reflectionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Verify ownership
    const { data: reflection } = await supabase.from('reflections').select('student_id').eq('id', reflectionId).single()
    if (!reflection || reflection.student_id !== user.id) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('reflections')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', reflectionId)

    if (error) return { error: error.message }

    revalidatePath('/reflections')
    revalidatePath(`/reflections/${reflectionId}`)
    return { success: true }
}

export async function getStudentReflections() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [] }

    const { data } = await supabase
        .from('reflections')
        .select('*')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false })

    return { data }
}

export async function getReflection(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data } = await supabase
        .from('reflections')
        .select(`
            *,
            teacher:users!reflections_teacher_id_fkey(codex_name)
        `)
        .eq('id', id)
        .single()

    if (!data) return { error: "Not found" }

    // Check access (Owner or Admin)
    const isAdmin = (await supabase.from('users').select('is_admin').eq('id', user.id).single()).data?.is_admin
    if (data.student_id !== user.id && !isAdmin) return { error: "Unauthorized" }

    return { data }
}

// For Teacher Dashboard
export async function getAllReflections() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: dbUser } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!dbUser?.is_admin) return { error: "Unauthorized" }

    const { data } = await supabase
        .from('reflections')
        .select(`
            *,
            student:users!reflections_student_id_fkey(email, codex_name)
        `)
        .order('updated_at', { ascending: false })

    return { data }
}
