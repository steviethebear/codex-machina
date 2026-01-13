import { useEffect, useState } from 'react'
import { Network, ArrowRight } from 'lucide-react'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['notes']['Row']

interface ConnectionsPanelProps {
    noteId: string
    onNoteClick: (note: Note) => void
    className?: string
}

import { fetchNodeConnections } from '@/lib/actions/links'

export function ConnectionsPanel({ noteId, onNoteClick, className }: ConnectionsPanelProps) {
    const [backlinks, setBacklinks] = useState<any[]>([])
    const [outgoingLinks, setOutgoingLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const { incoming, outgoing } = await fetchNodeConnections(noteId)
            setBacklinks(incoming || [])
            setOutgoingLinks(outgoing || [])
            setLoading(false)
        }
        load()
    }, [noteId])

    if (loading) return <div className="text-xs text-muted-foreground animate-pulse p-4">Loading connections...</div>

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Incoming */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Network className="h-3 w-3" />
                    Incoming
                </h3>
                {backlinks.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {backlinks.map(link => (
                            <button
                                key={link.id}
                                className="text-left text-xs bg-background p-2 rounded border hover:bg-muted transition-colors w-full"
                                onClick={() => link.source_note && onNoteClick(link.source_note)}
                            >
                                <div className="font-medium text-primary">{link.source_note?.title || 'Untitled'}</div>
                                {link.context && <p className="text-muted-foreground text-[10px] italic line-clamp-1 mt-1">"{link.context}"</p>}
                            </button>
                        ))}
                    </div>
                ) : <p className="text-xs text-muted-foreground italic pl-2">None</p>}
            </div>

            {/* Outgoing */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <ArrowRight className="h-3 w-3" />
                    Outgoing
                </h3>
                {outgoingLinks.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {outgoingLinks.map(link => (
                            <button
                                key={link.id}
                                className="text-left text-xs bg-background p-2 rounded border hover:bg-muted transition-colors w-full"
                                onClick={() => link.target_note && onNoteClick(link.target_note)}
                            >
                                <div className="font-medium text-primary">{link.target_note?.title || 'Untitled'}</div>
                            </button>
                        ))}
                    </div>
                ) : <p className="text-xs text-muted-foreground italic pl-2">None</p>}
            </div>
        </div>
    )
}
