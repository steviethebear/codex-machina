'use client'

import { SuggestionResults } from '@/lib/suggestions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Link as LinkIcon, Book } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RelatedNotesProps {
    suggestions: SuggestionResults
    onView?: (noteId: string) => void
    onQuickLink?: (noteId: string) => void
    onTextClick?: (textId: string) => void
    loading?: boolean
}

export function RelatedNotes({ suggestions, onView, onQuickLink, onTextClick, loading }: RelatedNotesProps) {
    if (loading) {
        return (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Finding related content...</h4>
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted rounded" />
                    ))}
                </div>
            </div>
        )
    }

    const totalCount = suggestions.notes.length + suggestions.texts.length

    if (totalCount === 0) {
        return (
            <div className="text-sm text-muted-foreground italic">
                No related content found yet
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium">Possible Connections ({totalCount})</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {/* Atoms */}
                {suggestions.notes.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Atoms ({suggestions.notes.length})</div>
                        {suggestions.notes.map(({ note, score, reason }) => {
                            // Color mapping
                            const getColors = (type: string) => {
                                switch (type) {
                                    case 'idea': return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500', badge: 'border-cyan-500/30 text-cyan-500' }
                                    case 'question': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500', badge: 'border-red-500/30 text-red-500' }
                                    case 'quote': return { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-500', badge: 'border-purple-500/30 text-purple-500' }
                                    case 'insight': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500', badge: 'border-yellow-500/30 text-yellow-500' }
                                    default: return { bg: 'bg-muted/30', border: 'border-transparent', text: 'text-muted-foreground', badge: 'text-muted-foreground' }
                                }
                            }
                            const colors = getColors(note.type)

                            return (
                                <Card key={note.id} className={`${colors.bg} ${colors.border} border transition-colors`}>
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className={`text-xs capitalize ${colors.bg} ${colors.badge}`}>
                                                        {note.type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {reason}
                                                    </span>
                                                </div>
                                                <div className={`font-medium text-sm truncate ${colors.text}`}>
                                                    {note.title}
                                                </div>
                                            </div>
                                            {(onView || onQuickLink) && (
                                                <div className="flex gap-1 flex-shrink-0">
                                                    {onView && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => onView(note.id)}
                                                            title="View full note"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {onQuickLink && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => onQuickLink(note.id)}
                                                            title="Link to this note"
                                                        >
                                                            <LinkIcon className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Texts */}
                {suggestions.texts.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Texts ({suggestions.texts.length})</div>
                        {suggestions.texts.map(({ text, score, reason }) => (
                            <Card
                                key={text.id}
                                className="bg-blue-500/10 hover:bg-blue-500/20 transition-colors border-blue-500/20 cursor-pointer"
                                onClick={() => onTextClick?.(text.id)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-2">
                                        <Book className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs capitalize bg-blue-500/10 border-blue-500/30">
                                                    {text.type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {reason}
                                                </span>
                                            </div>
                                            <div className="font-medium text-sm truncate">
                                                {text.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {text.author}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
