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
    const [hasQueried, setHasQueried] = useState(false)

    const fetchSuggestions = async () => {
        if (!context || context.length < 20) return
        
        setLoading(true)
        setHasQueried(true)
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

    if (!hasQueried) {
        return (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Smart Connections
                </div>
                <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchSuggestions} 
                    disabled={!context || context.length < 20}
                    title={(!context || context.length < 20) ? "Type more content to find connections" : ""}
                >
                    Find Connections
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2 mt-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Smart Connections
                </h3>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs px-2 text-primary" 
                    onClick={fetchSuggestions} 
                    disabled={loading || !context || context.length < 20}
                >
                    Refresh
                </Button>
            </div>

            {loading && <div className="text-xs text-muted-foreground animate-pulse">Analyzing...</div>}

            {!loading && suggestions.length === 0 && (
                <div className="text-xs text-muted-foreground">No similar notes found.</div>
            )}

            {!loading && suggestions.length > 0 && (
                <>
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
                                        Similarity Score: {Math.round(note.similarity * 100)}%
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
                    <div className="text-[10px] text-muted-foreground text-right relative -top-1">
                        Is this related? Click + to link.
                    </div>
                </>
            )}
        </div>
    )
}
