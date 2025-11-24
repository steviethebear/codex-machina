'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function setQualityFlag(
    atomId: string,
    qualityFlag: 'exemplary' | 'interesting' | 'needs_revision' | null,
    visibleToStudents: boolean,
    adminId: string
) {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
        .from('atomic_notes')
        .update({
            quality_flag: qualityFlag,
            flag_visible_to_students: visibleToStudents,
            flagged_by: qualityFlag ? adminId : null,
            flagged_at: qualityFlag ? new Date().toISOString() : null
        })
        .eq('id', atomId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}
