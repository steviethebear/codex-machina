'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createQuestion } from '@/lib/actions/questions/create-question'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type Text = Database['public']['Tables']['texts']['Row']

interface QuestionComposerProps {
    onSuccess: () => void
    onCancel: () => void
    preselectedTextId?: string
}

import { useOracle } from '@/components/oracle/oracle-context'

export function QuestionComposer({ onSuccess, onCancel, preselectedTextId }: QuestionComposerProps) {
    const { user } = useAuth()
    const { speak } = useOracle()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [selectedTextId, setSelectedTextId] = useState<string | undefined>(preselectedTextId)
    const [texts, setTexts] = useState<Text[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchTexts = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('texts')
                .select('*')
                .eq('archived', false)
                .order('title')

            if (data) {
                setTexts(data)
            }
        }
        fetchTexts()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !title.trim() || !body.trim()) return

        setIsSubmitting(true)
        try {
            const result = await createQuestion(user.id, {
                title,
                body,
                textId: selectedTextId,
            })

            if (result.success) {
                toast.success(result.message)
                if (result.oracleMessage) {
                    speak(result.oracleMessage, 'hint')
                }
                onSuccess()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error('Error creating question:', error)
            toast.error('Failed to create question')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
            <div className="space-y-2">
                <Input
                    placeholder="Question Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    className="font-medium"
                />
                <Textarea
                    placeholder="Elaborate on your question..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={isSubmitting}
                    className="min-h-[100px]"
                />

                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                        Related Text (Optional)
                    </label>
                    <Select
                        value={selectedTextId}
                        onValueChange={setSelectedTextId}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a text..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {texts.map(text => (
                                <SelectItem key={text.id} value={text.id}>
                                    {text.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !title.trim() || !body.trim()}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Post Question
                </Button>
            </div>
        </form>
    )
}
