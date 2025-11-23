'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { checkMeaning } from '@/lib/llm-stub'
import { MarkdownEditor } from '@/components/markdown/editor'
import { MarkdownRenderer } from '@/components/markdown/renderer'

type Note = Database['public']['Tables']['atomic_notes']['Row']

interface EditNoteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    note: Note | null
    onNoteUpdated?: () => void
}

export function EditNoteDialog({ open, onOpenChange, note, onNoteUpdated }: EditNoteDialogProps) {
    const { user } = useAuth()
    const supabase = createClient()

    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) { // Reset body when dialog opens for appending
            setBody('')
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !note) return
        setLoading(true)
        setError(null)

        if (body.length < 10) {
            setError('Addition must be at least 10 characters.')
            setLoading(false)
            return
        }

        // Meaning Check
        const meaning = await checkMeaning('Update', body)
        if (meaning !== 'meaningful') {
            const msg = `Update rejected: Content is ${meaning}. Please elaborate.`
            setError(msg)
            toast.error(msg)
            setLoading(false)
            return
        }

        const newContent = `${note.body}\n\n--- Update ---\n${body}`

        const { error: updateError } = await supabase
            .from('atomic_notes')
            // @ts-ignore
            .update({ body: newContent })
            .eq('id', note.id)

        if (updateError) {
            const msg = updateError.message
            setError(msg)
            toast.error(msg)
            setLoading(false)
            return
        }

        // Award Points for "Expanding" (Engagement)
        // @ts-ignore
        await supabase.from('actions').insert({
            user_id: user.id,
            type: 'REFLECTION', // Using REFLECTION type as proxy for "Editing/Expanding" for now
            xp: 0,
            sp_engagement: 2,
            description: 'Expanded atom content'
        })

        // Update Character Stats
        // @ts-ignore
        const { error: rpcError } = await supabase.rpc('increment_stats', {
            user_id_input: user.id,
            engagement_delta: 2
        })

        if (rpcError) {
            const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
            if (charData) {
                const char = charData as any
                // @ts-ignore
                await supabase.from('characters').update({
                    sp_engagement: char.sp_engagement + 2
                }).eq('id', char.id)
            }
        }

        toast.success('Atom updated successfully!')

        setLoading(false)
        setBody('') // Reset form
        onOpenChange(false)
        onNoteUpdated?.()
    }

    if (!note) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader onClose={() => onOpenChange(false)}>
                <DialogTitle>Expand Atom: {note.title}</DialogTitle>
                <DialogDescription>
                    Add new thoughts to this atom.
                </DialogDescription>
            </DialogHeader>

            <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm text-muted-foreground max-h-[200px] overflow-y-auto">
                <div className="font-semibold mb-2">Current Content:</div>
                {note.body}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Additions</label>
                    <textarea
                        required
                        className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your additional thoughts here..."
                    />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Append to Atom
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
