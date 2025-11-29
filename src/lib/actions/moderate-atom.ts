'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateNoteEmbedding } from '@/lib/llm/generate-embeddings'

export async function moderateAtom(atomId: string, action: 'approve' | 'reject') {
    try {
        const supabase = await createClient()

        // Call the RPC function which handles the admin check and update securely
        // @ts-ignore - RPC types might not be generated yet
        const { error } = await supabase.rpc('moderate_atom', {
            target_atom_id: atomId,
            new_status: action === 'approve' ? 'approved' : 'rejected',
            should_hide: action === 'reject'
        })

        if (error) {
            console.error('RPC error:', error)
            return { success: false, error: error.message }
        }

        // Generate embedding for approved notes
        if (action === 'approve') {
            updateNoteEmbedding(atomId).catch(err => {
                console.error('Failed to generate embedding:', err)
            })
        }

        revalidatePath('/admin/moderation')
        return { success: true }
    } catch (error) {
        console.error('Moderation action error:', error)
        return { success: false, error: 'Failed to moderate atom' }
    }
}
