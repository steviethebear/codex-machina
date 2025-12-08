'use client'

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database.types'
import { PlusCircle, Book } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Text = Database['public']['Tables']['texts']['Row']
type Note = Database['public']['Tables']['atomic_notes']['Row']

interface TextMenuProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    text: Text | null
    onCreateLinkedAtom: () => void
    onAskQuestion: () => void
}

export function TextMenu({ open, onOpenChange, text, onCreateLinkedAtom, onAskQuestion }: TextMenuProps) {
    const supabase = createClient()
    const [connectedAtoms, setConnectedAtoms] = useState<Note[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && text) {
            const fetchConnectedAtoms = async () => {
                setLoading(true)
                // Fetch atoms that link to this text
                const { data: links } = await supabase
                    .from('links')
                    .select('from_note_id')
                    .eq('to_text_id', text.id)

                if (links && links.length > 0) {
                    const noteIds = links.map((l: any) => l.from_note_id)
                    const { data: notes } = await supabase
                        .from('atomic_notes')
                        .select('*')
                        .in('id', noteIds)

                    if (notes) setConnectedAtoms(notes)
                } else {
                    setConnectedAtoms([])
                }
                setLoading(false)
            }
            fetchConnectedAtoms()
        }
    }, [open, text, supabase])

    if (!text) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader onClose={() => onOpenChange(false)}>
                <DialogTitle>
                    <div className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        {text.title}
                    </div>
                </DialogTitle>
                <DialogDescription>
                    Academic source
                </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
                {/* Text Details */}
                <div className="p-4 bg-muted/50 rounded-md space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Author:</span>
                        <span className="font-medium">{text.author}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{text.type}</span>
                    </div>
                </div>

                {/* Connected Atoms */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Connected Atoms ({connectedAtoms.length})</h4>
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Loading connections...</div>
                    ) : connectedAtoms.length > 0 ? (
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                            {connectedAtoms.map(atom => (
                                <div key={atom.id} className="p-2 bg-muted/30 rounded text-sm">
                                    <div className="font-medium">{atom.title}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{atom.type}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">No atoms connected yet</div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        className="flex-1"
                        onClick={() => {
                            onOpenChange(false)
                            onCreateLinkedAtom()
                        }}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Linked Atom
                    </Button>
                    <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => {
                            onOpenChange(false)
                            onAskQuestion()
                        }}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ask Question
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
