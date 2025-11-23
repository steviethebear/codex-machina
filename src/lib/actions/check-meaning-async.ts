'use server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export async function checkMeaningAsync(atomId: string) {
    try {
        const supabase = await createClient()

        // Get the atom with all needed data for XP/SP calculation
        const { data: atomData } = await supabase
            .from('atomic_notes')
            .select('id, title, body, text_id, author_id, character_id')
            .eq('id', atomId)
            .single()

        if (!atomData) {
            console.error(`Atom ${atomId} not found for moderation`)
            return
        }

        const atom = atomData as any
        const text = (atom.title + " " + atom.body).trim()
        const apiKey = process.env.GEMINI_API_KEY

        let moderationStatus: 'approved' | 'pending' = 'pending' // Default to pending
        let moderationResult = 'No AI check performed (no API key)'

        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey)
                const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest"]
                let analysis = ""

                for (const modelName of modelsToTry) {
                    try {
                        console.log(`[Async Moderation ${atomId}] Attempting with model: ${modelName}`)
                        const model = genAI.getGenerativeModel({ model: modelName })

                        const prompt = `
                        You are a content moderator for an academic RPG.
                        Analyze the following text. It should be a coherent thought, question, idea, or insight.
                        
                        STRICTLY REJECT (return "not meaningful") if the text is:
                        - Gibberish, random keys, or keyboard smashing (e.g., "asdf", "lksjdfl", "a;;lsj;alj")
                        - Mixed valid words and gibberish (e.g., "This is a asdf jkl")
                        - Nonsense or incoherent sentences
                        - Spam or repetitive patterns
                        
                        ALLOW (return "meaningful") if the text is:
                        - A valid sentence or thought (even if simple or with typos)
                        - A meta-comment or test (e.g., "Testing this feature")
                        - A question or idea
                        
                        Text to analyze: "${text}"
                        
                        Respond with ONLY one of these three strings:
                        - "meaningful"
                        - "unclear"
                        - "not meaningful"
                        `

                        const result = await model.generateContent(prompt)
                        const response = result.response
                        analysis = response.text().trim().toLowerCase().replace(/['"]/g, '')
                        console.log(`[Async Moderation ${atomId}] Gemini Analysis (${modelName}):`, analysis)
                        break // Success, exit loop
                    } catch (e: any) {
                        console.warn(`[Async Moderation ${atomId}] Model ${modelName} failed:`, e.message)
                        if (modelName === modelsToTry[modelsToTry.length - 1]) {
                            throw e // Throw if last model failed
                        }
                    }
                }

                if (analysis.includes('not meaningful')) {
                    moderationStatus = 'pending' // Keep pending, awaiting admin review
                    moderationResult = 'AI flagged as not meaningful (gibberish/spam) - Awaiting admin review'
                } else if (analysis.includes('unclear')) {
                    moderationStatus = 'pending' // Keep pending, awaiting admin review
                    moderationResult = 'AI flagged as unclear (ambiguous) - Awaiting admin review'
                } else if (analysis.includes('meaningful')) {
                    moderationStatus = 'approved'
                    moderationResult = 'AI approved as meaningful'
                } else {
                    moderationStatus = 'pending' // Keep pending, awaiting admin review
                    moderationResult = `AI gave unexpected response: ${analysis} - Awaiting admin review`
                }
            } catch (error: any) {
                console.error(`[Async Moderation ${atomId}] AI check error:`, error.message)
                moderationResult = `AI check failed: ${error.message}. Applying heuristics.`

                // Fallback heuristics
                if (text.length < 20) {
                    moderationStatus = 'pending' // Keep pending, awaiting admin review
                    moderationResult += ' Flagged: too short'
                } else if (text.toLowerCase().includes("spam")) {
                    moderationStatus = 'pending' // Keep pending, awaiting admin review
                    moderationResult += ' Flagged: spam detected'
                } else {
                    const nonAlpha = text.replace(/[a-zA-Z0-9\s.,!?'-]/g, '')
                    if (nonAlpha.length / text.length > 0.2) {
                        moderationStatus = 'pending' // Keep pending, awaiting admin review
                        moderationResult += ' Flagged: high non-alphanumeric ratio'
                    } else if (/(.)\\1{3,}/.test(text)) {
                        moderationStatus = 'pending' // Keep pending, awaiting admin review
                        moderationResult += ' Flagged: repetitive characters'
                    } else if (text.length > 30 && !text.includes(' ')) {
                        moderationStatus = 'pending' // Keep pending, awaiting admin review
                        moderationResult += ' Flagged: no spaces'
                    }
                }
            }
        }

        // Update the atom with moderation result
        // @ts-ignore
        await supabase.from('atomic_notes').update({
            moderation_status: moderationStatus,
            moderation_result: moderationResult,
            moderation_checked_at: new Date().toISOString()
        }).eq('id', atomId)

        console.log(`[Async Moderation ${atomId}] Complete. Status: ${moderationStatus}`)

        // Award XP/SP only if approved
        if (moderationStatus === 'approved') {
            console.log(`[Async Moderation ${atomId}] Awarding XP/SP...`)

            // Calculate points
            const spThinking = 2 // +2 SP Thinking for creating atom
            const spReading = atom.text_id ? 1 : 0 // +1 SP Reading if tagged to text

            try {
                // Insert action
                // @ts-ignore
                await supabase.from('actions').insert({
                    user_id: atom.author_id,
                    type: 'CREATE_NOTE',
                    xp: 0,
                    sp_thinking: spThinking,
                    sp_reading: spReading,
                    description: `Created atom: ${atom.title}`,
                    target_id: atom.id
                })

                // Update character stats
                // @ts-ignore
                const { error: rpcError } = await supabase.rpc('increment_stats', {
                    user_id_input: atom.author_id,
                    thinking_delta: spThinking,
                    reading_delta: spReading
                })

                if (rpcError) {
                    // Fallback: manual update
                    const { data: charData } = await supabase.from('characters').select('*').eq('id', atom.character_id).single()
                    if (charData) {
                        const char = charData as any
                        // @ts-ignore
                        await supabase.from('characters').update({
                            sp_thinking: char.sp_thinking + spThinking,
                            sp_reading: char.sp_reading + spReading,
                        }).eq('id', atom.character_id)
                    }
                }

                console.log(`[Async Moderation ${atomId}] XP/SP awarded successfully`)
            } catch (awardError) {
                console.error(`[Async Moderation ${atomId}] Failed to award XP/SP:`, awardError)
            }
        }
    } catch (error) {
        console.error(`[Async Moderation] Fatal error for atom ${atomId}:`, error)
    }
}
