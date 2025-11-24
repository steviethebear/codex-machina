'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAtomConnectionCount } from '@/lib/actions/check-hub-status'
import { HubBadge } from '@/components/hub-badge'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { ArrowRight, Link as LinkIcon, GitBranch, Edit3 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown/renderer'
import { RelatedNotes } from '@/components/related-notes'
import { findRelatedNotes, SuggestionResults } from '@/lib/suggestions'
import { CreateNoteDialog } from '@/components/graph/create-note-dialog'
import { LinkDialog } from '@/components/graph/link-dialog'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { QualityBadge } from '@/components/quality-badge'
import { useAuth } from '@/components/auth-provider'

type Note = Database['public']['Tables']['atomic_notes']['Row'] & {
    users: { codex_name: string | null } | null
    texts: { title: string } | null
}

type LinkType = Database['public']['Tables']['links']['Row'] & {
    to_note: { title: string } | null
    from_note: { title: string } | null
    to_text: { title: string } | null
}

export default function NoteDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const supabase = createClient()

    const [note, setNote] = useState<Note | null>(null)
    const [outgoingLinks, setOutgoingLinks] = useState<LinkType[]>([])
    const [incomingLinks, setIncomingLinks] = useState<LinkType[]>([])
    const [relatedNotes, setRelatedNotes] = useState<SuggestionResults>({ notes: [], texts: [] })
    const [connectionCount, setConnectionCount] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    // Dialog States
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const fetchNote = async () => {
        // Fetch Note
        const { data: noteData, error } = await supabase
            .from('atomic_notes')
            .select(`
          *,
          users:users!atomic_notes_author_id_fkey (codex_name),
          texts (title)
        `)
            .eq('id', id)
            .single()

        if (noteData) setNote(noteData as any) // Type assertion needed due to join

        // Fetch Outgoing Links
        const { data: outData } = await supabase
            .from('links')
            .select(`
          *,
          to_note:atomic_notes!links_to_note_id_fkey(title),
          to_text:texts(title)
        `)
            .eq('from_note_id', id)

        if (outData) setOutgoingLinks(outData as any)

        // Fetch Incoming Links
        const { data: inData } = await supabase
            .from('links')
            .select(`
          *,
          from_note:atomic_notes!links_from_note_id_fkey(title)
        `)
            .eq('to_note_id', id)

        if (inData) setIncomingLinks(inData as any)

        // Find Related Notes (if note exists)
        if (noteData) {
            // @ts-ignore
            const suggestions = await findRelatedNotes(supabase, {
                title: noteData.title,
                body: noteData.body,
                type: noteData.type,
                textId: noteData.text_id,
                excludeId: id,
                userId: (await supabase.auth.getUser()).data.user?.id || ''
            })

            // Get connection count
            const count = await getAtomConnectionCount(id)
            setConnectionCount(count)

            // Filter out notes that are already linked
            const linkedNoteIds = new Set([
                ...(outData?.map(l => l.to_note_id) || []),
                ...(inData?.map(l => l.from_note_id) || [])
            ])

            // Filter out texts that are already linked
            const linkedTextIds = new Set([
                ...(outData?.map(l => l.to_text_id) || [])
            ])

            setRelatedNotes({
                notes: suggestions.notes.filter(s => !linkedNoteIds.has(s.note.id)),
                texts: suggestions.texts.filter(s => !linkedTextIds.has(s.text.id))
            })
        }

        setLoading(false)
    }

    useEffect(() => {
        if (id) fetchNote()
    }, [id, supabase])

    if (loading) return <div className="p-8">Loading transmission...</div>
    if (!note) return <div className="p-8">Note not found.</div>

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <MarkdownRenderer content={note.title} className="prose-p:inline prose-p:m-0" />
                        {connectionCount >= 5 && <HubBadge connectionCount={connectionCount} />}
                    </h2>
                    {note.quality_flag && (
                        <div className="mb-3">
                            <QualityBadge quality={note.quality_flag} />
                        </div>
                    )}
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        By <span className="text-primary">{note.users?.codex_name || 'Unknown'}</span> • {note.type.toUpperCase()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLinkDialogOpen(true)}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Connect
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        Branch
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Expand
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <MarkdownRenderer content={note.body} />
                    {note.texts && (
                        <div className="mt-6 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">Reference: </span>
                            <span className="text-sm font-medium">{note.texts.title}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Outgoing Connections</h3>
                    {outgoingLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No outgoing links.</p>
                    ) : (
                        <div className="space-y-4">
                            {outgoingLinks.map(link => (
                                <Card key={link.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded border bg-muted">
                                                {link.relation_type}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            {link.to_note ? (
                                                <Link href={`/notes/${link.to_note_id}`} className="text-sm font-medium hover:underline">
                                                    {link.to_note.title}
                                                </Link>
                                            ) : link.to_text ? (
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {link.to_text.title} (Text)
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{link.explanation}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Incoming Connections</h3>
                    {incomingLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No incoming links.</p>
                    ) : (
                        <div className="space-y-4">
                            {incomingLinks.map(link => (
                                <Card key={link.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            {link.from_note ? (
                                                <Link href={`/notes/${link.from_note_id}`} className="text-sm font-medium hover:underline">
                                                    {link.from_note.title}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-medium">Unknown</span>
                                            )}
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-mono px-2 py-0.5 rounded border bg-muted">
                                                {link.relation_type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{link.explanation}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Related Signals */}
            {(relatedNotes.notes.length > 0 || relatedNotes.texts.length > 0) && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        Related Signals
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        The Machine has detected resonance with these existing atoms.
                    </p>
                    <RelatedNotes
                        suggestions={relatedNotes}
                        onSelectText={() => { }}
                        onSelectNote={(note) => {
                            window.location.href = `/notes/${note.id}`
                        }}
                    />
                </div>
            )}

            {/* Dialogs */}
            <CreateNoteDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                sourceAtom={note}
                onAtomCreated={fetchNote}
            />
            <LinkDialog
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                sourceNote={note}
                onLinkCreated={fetchNote}
            />
            <EditNoteDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                note={note}
                onNoteUpdated={fetchNote}
            />
        </div>
    )
}
