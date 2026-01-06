'use client'

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Quote, FileText, ArrowLeft, ArrowRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['notes']['Row']

interface SourceSlideOverProps {
    open: boolean
    source: any
    onClose: () => void
    onNavigate?: (note: Note) => void
}

export function SourceSlideOver({ open, source, onClose, onNavigate }: SourceSlideOverProps) {
    const [backlinks, setBacklinks] = useState<Note[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!source || !open) return

        const fetchBacklinks = async () => {
            setLoading(true)
            // Strategy: Find notes that mention this source title in content using ilike
            // OR checks citation field if strictly stored there
            // "[[Title]]" is standard
            const { data } = await supabase
                .from('notes')
                .select('*')
                .ilike('content', `%[[${source.title}]]%`)
                .order('updated_at', { ascending: false })

            if (data) setBacklinks(data)
            setLoading(false)
        }
        fetchBacklinks()
    }, [source, open, supabase])

    if (!source) return null

    return (
        <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-none p-0 bg-background border-l shadow-2xl">
                {/* Accessibility: Hidden Title */}
                <SheetTitle className="sr-only">Source Details</SheetTitle>

                <div className="flex-1 h-full overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <div className="px-6 py-6 border-b flex items-start justify-between bg-card text-card-foreground">
                        <div className="space-y-1 pr-8">
                            <Badge variant="outline" className="capitalize mb-2">
                                {source.type}
                            </Badge>
                            <h2 className="text-xl font-bold leading-tight">
                                {source.title}
                            </h2>
                            <p className="text-muted-foreground font-medium">
                                {source.author}
                            </p>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">
                            {/* Description */}
                            {source.description && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase opacity-70 tracking-wider">
                                        Description
                                    </h3>
                                    <div className="text-base leading-relaxed bg-muted/30 p-4 rounded-lg border">
                                        {source.description}
                                    </div>
                                </div>
                            )}

                            {/* URL */}
                            {source.url && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase opacity-70 tracking-wider">
                                        Source Link
                                    </h3>
                                    <div className="flex items-center gap-2 p-3 bg-blue-50/5 rounded-lg border border-blue-100/10">
                                        <ExternalLink className="h-4 w-4 text-blue-400 shrink-0" />
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline truncate flex-1 text-sm break-all"
                                        >
                                            {source.url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Backlinks (Incoming Links) */}
                            <div className="space-y-3 pt-4 border-t">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase opacity-70 tracking-wider flex items-center gap-2">
                                    <Quote className="h-4 w-4" />
                                    Referenced By ({backlinks.length})
                                </h3>

                                {loading ? (
                                    <div className="text-sm text-muted-foreground animate-pulse">Searching connections...</div>
                                ) : backlinks.length === 0 ? (
                                    <div className="text-sm text-muted-foreground italic">
                                        No notes currently reference this source.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {backlinks.map(note => (
                                            <button
                                                key={note.id}
                                                onClick={() => onNavigate && onNavigate(note)}
                                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 hover:border-accent text-left transition-colors group"
                                            >
                                                <FileText className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                        {note.title || "Untitled Note"}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {note.content?.replace(/\[\[.*?\]\]/g, '').slice(0, 100)}...
                                                    </p>
                                                </div>
                                                {onNavigate && <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Meta Info */}
                            <div className="pt-6 border-t mt-8 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <div>
                                    <span className="block opacity-70">Format</span>
                                    <span className="capitalize">{source.type}</span>
                                </div>
                                {source.created_at && (
                                    <div>
                                        <span className="block opacity-70">Added</span>
                                        <span>{new Date(source.created_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    )
}
