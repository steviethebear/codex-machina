'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOutline(title: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('outlines')
        .insert({
            user_id: user.id,
            title,
            structure: [], // Initial empty structure
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating outline:', error)
        return { error: error.message }
    }

    revalidatePath('/outlines')
    return { data }
}

export async function getOutlines() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('outlines')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function getOutline(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('outlines')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function updateOutlineStructure(id: string, structure: any[]) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('outlines')
        .update({
            structure,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/outlines/${id}`)
    return { success: true }
}
