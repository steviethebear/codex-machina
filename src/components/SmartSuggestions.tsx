'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { searchSimilarNotes } from '@/lib/actions/search'
import { Button } from '@/components/ui/button'

interface Suggestion {
    id: string
    title: string
    similarity: number
    type: string
}

export function SmartSuggestions({ context, currentId, onLink, onOpen }: { context: string, currentId?: string, onLink: (title: string) => void, onOpen: (title: string) => void }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchSuggestions = async () => {
            // Only search if enough context
            if (!context || context.length < 20) return

            setLoading(true)
            try {
                const results = await searchSimilarNotes(context, 0.2, 5) // Slightly higher threshold than debug
                if (results) {
                    // Filter out current note and already exact connections (crudely)
                    const filtered = results.filter((r: any) => r.id !== currentId)
                    setSuggestions(filtered)
                }
            } catch (err) {
                console.error("Failed to fetch suggestions", err)
            } finally {
                setLoading(false)
            }
        }

        // Debounce
        const timer = setTimeout(fetchSuggestions, 1000)
        return () => clearTimeout(timer)
    }, [context, currentId])

    if (suggestions.length === 0 && !loading) return null

    return (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2 mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Smart Connections
            </h3>

            {loading && <div className="text-xs text-muted-foreground animate-pulse">Analyzing...</div>}

            <div className="space-y-1">
                {suggestions.map((note) => (
                    <div key={note.id} className="flex items-center justify-between group">
                        <div className="flex flex-col">
                            <span
                                className="text-sm cursor-pointer hover:underline hover:text-primary transition-colors leading-tight py-1"
                                title="Click to view"
                                onClick={() => onOpen(note.title)}
                            >
                                {note.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {Math.round(note.similarity * 100)}% match
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => onLink(note.title)}
                        >
                            +
                        </Button>
                    </div>
                ))}
            </div>
            {suggestions.length > 0 && (
                <div className="text-[10px] text-muted-foreground text-right">
                    Is this related? Click + to link.
                </div>
            )}
        </div>
    )
}
