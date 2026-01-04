import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, BookOpen, Clock, Brain } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['notes']['Row'] & {
    user?: {
        codex_name?: string | null
        email?: string | null
    }
    tags?: string[] | null
}

interface FeedCardProps {
    note: Note
    onClick: () => void
}

export function FeedCard({ note, onClick }: FeedCardProps) {
    const authorName = note.user?.codex_name || note.user?.email?.split('@')[0] || 'Unknown'
    const isSource = note.type === 'source'

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group h-full flex flex-col"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {note.title || 'Untitled'}
                    </CardTitle>
                    {isSource && <Badge variant="secondary" className="shrink-0"><BookOpen className="h-3 w-3 mr-1" /> Source</Badge>}
                    {note.type === 'permanent' && <Badge variant="outline" className="shrink-0 text-green-600 border-green-200 bg-green-50"><Brain className="h-3 w-3 mr-1" /> Note</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 font-mono">
                    {note.content}
                </p>
                {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground bg-muted hover:bg-muted-foreground/10">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/5 flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="font-medium max-w-[120px] truncate" title={authorName}>{authorName}</span>
                </div>
                <div className="flex items-center gap-1" title={new Date(note.updated_at).toLocaleString()}>
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                </div>
            </CardFooter>
        </Card>
    )
}
