import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { NoteEditor } from "@/components/pkm/NoteEditor"
import { ConnectionsPanel } from "@/components/pkm/ConnectionsPanel"
import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

type Note = Database['public']['Tables']['notes']['Row']

interface NoteSlideOverProps {
    note: Note | null
    open: boolean
    onClose: () => void
    onOpenNote?: (note: Note) => void
    onUpdate?: (note: Note) => void
    onNavigate?: (note: Note) => void // New prop for peeking/drilling down
    onUserClick?: (userId: string) => void
}

export function NoteSlideOver({ note, open, onClose, onOpenNote, onUpdate, onNavigate, onUserClick }: NoteSlideOverProps) {
    const supabase = createClient()

    // Handler for clicking a wiki-link title in Editor
    const handleLinkClick = async (title: string) => {
        if (!onNavigate) return
        // Fetch note by title
        const { data } = await supabase.from('notes').select('*').eq('title', title).single()
        if (data) {
            onNavigate(data as Note)
        } else {
            // Check Texts
            const { data: textData } = await supabase.from('texts').select('*').eq('title', title).single()
            if (textData) {
                const mapped: any = {
                    ...textData, // Include ALL source fields (author, year, url, etc.)
                    id: textData.id,
                    title: textData.title,
                    content: textData.description || `by ${textData.author}`,
                    type: 'source', // Force type for detection
                    textType: textData.type, // Preserve original type if needed
                    user_id: 'system',
                    created_at: textData.created_at,
                    updated_at: textData.created_at,
                    is_public: true,
                    tags: ['system-source', textData.type],
                    citation: textData.author,
                    page_number: null,
                    embedding: null
                }
                onNavigate(mapped)
            }
        }
    }

    if (!note) return null

    return (
        <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-none p-0 bg-background border-l shadow-2xl">
                {/* Accessibility: Hidden Title */}
                <SheetTitle className="sr-only">Note Editor</SheetTitle>

                <div className="flex-1 h-full overflow-hidden flex flex-col pt-10">
                    {/* Editor Area */}
                    <div className="flex-1 overflow-hidden">
                        <NoteEditor
                            note={note}
                            onUpdate={onUpdate}
                            onDelete={onClose}
                            onLinkClick={handleLinkClick}
                            onUserClick={onUserClick}
                            className="h-full"
                        />
                    </div>

                    {/* Footer: Connections & Actions */}
                    <div className="h-1/3 border-t bg-muted/10 flex flex-col">
                        <div className="p-2 border-b text-xs font-semibold text-muted-foreground bg-muted/20">
                            Context
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <ConnectionsPanel
                                noteId={note.id}
                                onNoteClick={(n) => onNavigate && onNavigate(n)}
                            />
                        </ScrollArea>

                        <div className="p-2 border-t bg-background flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                // Navigate to my-notes with pre-fill
                                window.location.href = `/my-notes?action=new&linkTo=${encodeURIComponent(note.title || '')}`
                            }}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Write about this
                            </Button>
                            {onOpenNote && (
                                <Button variant="ghost" size="sm" onClick={() => { onOpenNote(note); onClose(); }}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Full Page
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
