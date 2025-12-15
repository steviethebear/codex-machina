'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Brain, BookOpen, Lightbulb, Save, Trash2, Edit2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateNote, deleteNote, promoteNote } from '@/lib/actions/notes'
import { Database } from '@/types/database.types'
import { useAuth } from '@/components/auth-provider'

type Note = Database['public']['Tables']['notes']['Row']
type UserProfile = { id: string, email: string, codex_name?: string }

import { PromoteNoteDialog } from './PromoteNoteDialog'

interface NoteEditorProps {
    note: Note
    onUpdate?: (note: Note) => void
    onDelete?: () => void
    onLinkClick?: (title: string) => void
    className?: string
}

export function NoteEditor({ note, onUpdate, onDelete, onLinkClick, className }: NoteEditorProps) {
    const { user } = useAuth()
    const supabase = createClient()

    // Permission Check
    const isOwner = user?.id === note.user_id

    // State
    const [title, setTitle] = useState(note.title)
    const [content, setContent] = useState(note.content)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date>(new Date(note.updated_at))
    const [showPromoteDialog, setShowPromoteDialog] = useState(false)

    // Autocomplete State
    const [users, setUsers] = useState<UserProfile[]>([])
    const [publicNotes, setPublicNotes] = useState<Note[]>([])
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionType, setMentionType] = useState<'wiki' | 'mention' | null>(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Load Data for Autocomplete
    useEffect(() => {
        setTitle(note.title)
        setContent(note.content)
        setLastSaved(new Date(note.updated_at))

        const loadAutocompleteData = async () => {
            const [notesRes, usersRes] = await Promise.all([
                supabase.from('notes').select('*').eq('is_public', true),
                supabase.from('users').select('id, email, codex_name')
            ])
            if (notesRes.data) setPublicNotes(notesRes.data as Note[])
            if (usersRes.data) setUsers(usersRes.data as UserProfile[])
        }
        loadAutocompleteData()
    }, [note.id, supabase])

    // Autosave
    useEffect(() => {
        if (!isOwner || !isEditing) return

        const timer = setTimeout(async () => {
            if (content !== note.content || title !== note.title) {
                setIsSaving(true)
                const result = await updateNote(note.id, { title, content })
                if (result.data) {
                    setLastSaved(new Date())
                    if (onUpdate) onUpdate(result.data as Note)
                }
                setIsSaving(false)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [content, title, isOwner, isEditing, note.content, note.title, note.id, onUpdate])

    // Handlers
    const handleSave = async () => {
        setIsSaving(true)
        const result = await updateNote(note.id, { title, content })
        if (result.data) {
            toast.success("Saved")
            setLastSaved(new Date())
            setIsEditing(false)
            if (onUpdate) onUpdate(result.data as Note)
        } else {
            toast.error("Save failed")
        }
        setIsSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure?")) return
        await deleteNote(note.id)
        if (onDelete) onDelete()
    }

    // Autocomplete Logic
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setContent(val)

        const cursor = e.target.selectionStart
        setCursorPosition(cursor)

        const textBefore = val.slice(0, cursor)
        const matchWiki = textBefore.match(/\[\[([\w\s]*)$/)
        const matchMention = textBefore.match(/@([\w]*)$/)

        if (matchWiki) {
            setMentionQuery(matchWiki[1])
            setMentionType('wiki')
        } else if (matchMention) {
            setMentionQuery(matchMention[1])
            setMentionType('mention')
        } else {
            setMentionQuery(null)
            setMentionType(null)
        }
    }

    const insertLink = (item: Note | UserProfile) => {
        if (mentionQuery === null || !mentionType) return

        let prefix = '', suffix = '', text = ''
        if (mentionType === 'wiki') {
            prefix = '[['; suffix = ']]'; text = (item as Note).title
        } else {
            prefix = '@'; suffix = ' ';
            const u = item as UserProfile
            text = u.codex_name?.replace(/\s+/g, '') || u.email.split('@')[0]
        }

        const before = content.slice(0, cursorPosition - (mentionQuery.length + prefix.length))
        const after = content.slice(cursorPosition)
        const newContent = before + prefix + text + suffix + after

        setContent(newContent)
        setMentionQuery(null)
        setMentionType(null)

        // Restore focus
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                const newPos = before.length + prefix.length + text.length + suffix.length
                textareaRef.current.setSelectionRange(newPos, newPos)
            }
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionQuery !== null && mentionType) {
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                let match = null
                if (mentionType === 'wiki') {
                    match = publicNotes.find(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase()) && n.id !== note.id)
                } else {
                    match = users.find(u => u.email.toLowerCase().includes(mentionQuery.toLowerCase()) || (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery.toLowerCase())))
                }
                if (match) insertLink(match)
            } else if (e.key === 'Escape') {
                setMentionQuery(null)
                setMentionType(null)
            }
        }
    }

    // Render View Mode (Wiki Links)
    const renderWikiContent = (text: string) => {
        if (!text) return <span className="italic opacity-50">No content</span>
        const parts = text.split(/(\[\[.*?\]\]|@\S+)/g)
        return parts.map((part, index) => {
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const title = part.slice(2, -2)
                return (
                    <span
                        key={index}
                        className="text-blue-500 font-medium cursor-pointer hover:underline"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onLinkClick) onLinkClick(title)
                        }}
                    >
                        {title}
                    </span>
                )
            }
            if (part.startsWith('@')) {
                return <span key={index} className="text-green-600 font-semibold">{part}</span>
            }
            return <span key={index}>{part}</span>
        })
    }

    return (
        <div className={cn("flex flex-col h-full relative", className)}>
            <PromoteNoteDialog
                open={showPromoteDialog}
                onOpenChange={setShowPromoteDialog}
                note={note}
                onSuccess={(updatedNote) => {
                    if (onUpdate) onUpdate(updatedNote)
                }}
            />

            {/* Header / Toolbar */}
            <div className="p-4 border-b flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 w-full mr-4">
                        <div className="flex items-center gap-2 mb-1">
                            {note.type === 'fleeting' && <Badge variant="secondary"><Lightbulb className="h-3 w-3 mr-1" /> Inbox</Badge>}
                            {note.type === 'permanent' && <Badge variant="secondary"><Brain className="h-3 w-3 mr-1" /> Note</Badge>}
                            {note.type === 'source' && <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" /> Source</Badge>}
                            <span className="text-xs text-muted-foreground">{lastSaved.toLocaleDateString()} {lastSaved.toLocaleTimeString()}</span>
                        </div>
                        {isEditing ? (
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="text-2xl font-bold h-auto py-2 px-1 border-transparent hover:border-input focus:border-input transition-all"
                                placeholder="Note Title"
                            />
                        ) : (
                            <h2
                                className="text-2xl font-bold leading-tight cursor-pointer hover:underline decoration-dashed decoration-muted-foreground/30"
                                onClick={() => isOwner && setIsEditing(true)}
                            >
                                {title || "Untitled"}
                            </h2>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {isOwner && note.type === 'fleeting' && (
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setShowPromoteDialog(true)} title="Promote to Permanent Note">
                                <Brain className="h-4 w-4" />
                            </Button>
                        )}
                        {isOwner && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete} title="Delete Note">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        {isOwner && !isEditing && (
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        )}
                        {isEditing && (
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? '...' : <Save className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor / Viewer */}
            <div className="flex-1 overflow-hidden relative group">
                {isEditing ? (
                    <div className="w-full h-full relative">
                        <Textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            onKeyDown={handleKeyDown}
                            className="w-full h-full resize-none p-6 border-none focus-visible:ring-0 font-mono text-sm leading-relaxed"
                            placeholder="Start writing..."
                        />
                        {/* Autocomplete Dropdown */}
                        {mentionQuery !== null && (
                            <div className="absolute bottom-4 left-4 z-50 p-2 bg-popover text-popover-foreground rounded-md border shadow-md w-64 max-h-48 overflow-y-auto">
                                <div className="text-xs font-semibold mb-2 text-muted-foreground">
                                    {mentionType === 'wiki' ? 'Link to Note' : 'Mention User'}
                                </div>
                                {(() => {
                                    const items = mentionType === 'wiki'
                                        ? publicNotes.filter(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase()) && n.id !== note.id)
                                        : users.filter(u => u.email.toLowerCase().includes(mentionQuery.toLowerCase()) || (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery.toLowerCase())))

                                    if (items.length === 0) return <div className="text-xs p-2 italic text-muted-foreground">No matches</div>

                                    return items.map((item: any) => (
                                        <button
                                            key={item.id}
                                            className="flex items-center w-full p-2 text-sm rounded-sm hover:bg-accent text-left"
                                            onClick={() => insertLink(item)}
                                        >
                                            {mentionType === 'wiki' ? <BookOpen className="h-3 w-3 mr-2" /> : <ExternalLink className="h-3 w-3 mr-2" />}
                                            <span className="truncate">{item.title || item.codex_name || item.email}</span>
                                        </button>
                                    ))
                                })()}
                            </div>
                        )}
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div
                            className="p-6 text-sm leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground min-h-[500px]"
                            onClick={() => isOwner && setIsEditing(true)}
                        >
                            {renderWikiContent(content)}
                        </div>
                    </ScrollArea>
                )}
            </div>

        </div>
    )
}
