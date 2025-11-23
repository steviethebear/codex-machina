'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { ArrowRight, Link as LinkIcon } from 'lucide-react'

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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNote = async () => {
            // Fetch Note
            const { data: noteData, error } = await supabase
                .from('atomic_notes')
                .select(`
          *,
          users (codex_name),
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

            setLoading(false)
        }

        if (id) fetchNote()
    }, [id, supabase])

    if (loading) return <div className="p-8">Loading transmission...</div>
    if (!note) return <div className="p-8">Note not found.</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{note.title}</h1>
                    <p className="text-muted-foreground mt-2">
                        By <span className="text-primary">{note.users?.codex_name || 'Unknown'}</span> • {note.type.toUpperCase()}
                    </p>
                </div>
                <Link href={`/links/create?fromId=${note.id}`}>
                    <Button className="gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Connect
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap leading-relaxed text-lg">
                        {note.body}
                    </p>
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
                        <div className="space-y-2">
                            {outgoingLinks.map((link) => (
                                <Card key={link.id} className="bg-muted/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                            <span>{link.relation_type}</span>
                                            <ArrowRight className="h-3 w-3" />
                                            {link.to_note ? (
                                                <Link href={`/notes/${link.to_note_id}`} className="hover:underline text-primary">
                                                    {link.to_note.title}
                                                </Link>
                                            ) : (
                                                <span className="text-secondary">{link.to_text?.title}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{link.explanation}</p>
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
                        <div className="space-y-2">
                            {incomingLinks.map((link) => (
                                <Card key={link.id} className="bg-muted/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                            <Link href={`/notes/${link.from_note_id}`} className="hover:underline text-primary">
                                                {link.from_note?.title}
                                            </Link>
                                            <ArrowRight className="h-3 w-3" />
                                            <span>{link.relation_type}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{link.explanation}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
