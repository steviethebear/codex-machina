'use client'

import { SuggestedNote } from '@/lib/suggestions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RelatedNotesProps {
    suggestions: SuggestedNote[]
    onView?: (noteId: string) => void
    onQuickLink?: (noteId: string) => void
    loading?: boolean
}

export function RelatedNotes({ suggestions, onView, onQuickLink, loading }: RelatedNotesProps) {
    if (loading) {
        return (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Finding related atoms...</h4>
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted rounded" />
                    ))}
                </div>
            </div>
        )
    }

    if (suggestions.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic">
                No related atoms found yet
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Possible Connections ({suggestions.length})</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {suggestions.map(({ note, score, reason }) => (
                    <Card key={note.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {note.type}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {reason}
                                        </span>
                                    </div>
                                    <div className="font-medium text-sm truncate">
                                        {note.title}
                                    </div>
                                </div>
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
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
