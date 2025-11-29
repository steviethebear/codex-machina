'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NoteXPDisplayProps {
    noteId: string
    userId: string
}

export function NoteXPDisplay({ noteId, userId }: NoteXPDisplayProps) {
    const [totalXP, setTotalXP] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNoteXP = async () => {
            const supabase = createClient()

            // Get all actions related to this note
            const { data: actions } = await supabase
                .from('actions')
                .select('xp')
                .eq('user_id', userId)
                .or(`target_id.eq.${noteId},description.ilike.%${noteId}%`)

            if (actions) {
                const total = actions.reduce((sum, action) => sum + (action.xp || 0), 0)
                setTotalXP(total)
            }

            setLoading(false)
        }

        if (noteId && userId) {
            fetchNoteXP()
        }
    }, [noteId, userId])

    if (loading) return null

    if (totalXP === 0) return null

    return (
        <div className="text-xs text-green-400 mb-2">
            ⚡ {totalXP} XP earned from this note
        </div>
    )
}
