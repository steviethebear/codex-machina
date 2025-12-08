'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types for Evaluation
export type EvaluationResult = {
    score: number // 0-4
    feedback: string
    suggestions?: string[]
}

export async function evaluateNote(noteId: string, noteType: 'literature' | 'permanent'): Promise<EvaluationResult | { error: string }> {
    // TODO: Connect to actual LLM provider (OpenAI/Anthropic/Gemini)
    // For v0.5 MVP Phase 2, we return a mock success response.

    console.log(`Evaluating ${noteType} note: ${noteId}`)

    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockResult: EvaluationResult = {
        score: 3,
        feedback: "This is a solid start. You've captured the main idea, but could deepen the connection to the core theme of the unit.",
        suggestions: ["Consider adding a connection to 'Simulacra'"]
    }

    return mockResult
}

export async function evaluateConnection(explanation: string): Promise<EvaluationResult | { error: string }> {
    // TODO: Connect to actual LLM provider
    console.log(`Evaluating connection: ${explanation}`)

    await new Promise(resolve => setTimeout(resolve, 800))

    const mockResult: EvaluationResult = {
        score: 4,
        feedback: "Excellent connection. You clearly articulated the relationship between these two concepts.",
    }

    return mockResult
}
