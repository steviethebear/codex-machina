'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth-provider'
import { checkMeaningAsync } from '@/lib/actions/check-meaning-async'
import { Loader2, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/types/database.types'
import { Combobox } from '@/components/ui/combobox'

type Text = Database['public']['Tables']['texts']['Row']

export default function CreateNotePage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [type, setType] = useState<'idea' | 'question' | 'quote' | 'insight'>('idea')
    const [textId, setTextId] = useState<string>('')
    const [texts, setTexts] = useState<Text[]>([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTexts = async () => {
            const { data } = await supabase.from('texts').select('*').eq('archived', false)
            if (data) setTexts(data)
        }
        fetchTexts()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)
        setError(null)

        // 1. Get Character ID (no blocking check)
        const { data: charData } = await supabase
            .from('characters')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!charData) {
            setError('Character not found.')
            setLoading(false)
            return
        }
        const char = charData as any

        // 3. Create Atom
        const { data: newAtom, error: noteError } = await supabase
            .from('atomic_notes')
            // @ts-ignore
            .insert({
                author_id: user.id,
                character_id: char.id,
                title,
                body,
                type,
                text_id: textId || null,
            })
            .select()
            .single()

        if (noteError || !newAtom) {
            setError(noteError?.message || 'Failed to create atom')
            setLoading(false)
            return
        }

        const atom = newAtom as any

        // Success - points will be awarded by async moderation

        toast.success('Atom created successfully!')

        // Trigger async moderation (don't await)
        checkMeaningAsync(atom.id).catch((err) => {
            console.error('Async moderation failed:', err)
        })

        router.push('/dashboard')
        router.refresh()
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-2xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create New Atom</h2>
                <p className="text-muted-foreground">Capture an idea, question, or insight.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a concise title"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                    >
                        <option value="idea">Idea</option>
                        <option value="question">Question</option>
                        <option value="quote">Quote</option>
                        <option value="insight">Insight</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Related Text (Optional)</label>
                    <Combobox
                        options={texts.map((text) => ({
                            value: text.id,
                            label: text.title,
                            sublabel: `${text.author} (${text.type})`
                        }))}
                        value={textId}
                        onValueChange={setTextId}
                        placeholder="None"
                        searchPlaceholder="Search texts..."
                        emptyText="No texts found."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Body</label>
                    <textarea
                        required
                        className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Elaborate on your thought..."
                    />
                    <p className="text-xs text-muted-foreground">
                        Minimum length: 20 characters.
                    </p>
                </div>

                {error && (
                    <div className="text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Create Atom
                    </Button>
                </div>
            </form>
        </div>
    )
}
