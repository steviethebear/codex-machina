'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Note = Database['public']['Tables']['notes']['Row']
type UserProfile = { id: string, email: string, codex_name?: string }

import { PromoteNoteDialog } from './PromoteNoteDialog'
import { SmartSuggestions } from '@/components/SmartSuggestions'

interface NoteEditorProps {
    note: Note
    onUpdate?: (note: Note) => void
    onDelete?: () => void
    onLinkClick?: (title: string) => void
    className?: string
}

export function NoteEditor({ note, onUpdate, onDelete, onLinkClick, className }: NoteEditorProps) {
    const { user } = useAuth()
    const router = useRouter()
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
    const [sources, setSources] = useState<any[]>([])
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionType, setMentionType] = useState<'wiki' | 'mention' | null>(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [author, setAuthor] = useState<{ email: string, codex_name?: string } | null>(null)
    const [points, setPoints] = useState<number>(0)

    // Force exit edit mode if note becomes permanent
    useEffect(() => {
        if (note.type === 'permanent') {
            setIsEditing(false)
        }
    }, [note.type])

    // Load Data for Autocomplete & Meta
    useEffect(() => {
        setTitle(note.title)
        setContent(note.content)
        setLastSaved(new Date(note.updated_at))

        const loadMeta = async () => {
            // Author (if not owner, or if we just want to display it always)
            // Check if note object already has 'user' (from Feed)
            // @ts-ignore
            if (note.user) {
                // @ts-ignore
                setAuthor(note.user)
            } else if (note.user_id !== user?.id) {
                const { data } = await supabase.from('users').select('email, codex_name').eq('id', note.user_id).single()
                if (data) setAuthor({ email: (data as any).email, codex_name: (data as any).codex_name || undefined })
            } else if (user) {
                setAuthor({ email: user.email!, codex_name: user?.user_metadata?.codex_name })
            }

            // Points
            const { data: pointsData } = await supabase.from('points').select('amount').eq('source_id', note.id)
            if (pointsData) {
                setPoints((pointsData as any[]).reduce((acc, curr) => acc + curr.amount, 0))
            }
        }
        loadMeta()

        const loadAutocompleteData = async () => {
            const [notesRes, usersRes, sourcesRes] = await Promise.all([
                supabase.from('notes').select('*').eq('is_public', true),
                supabase.from('users').select('id, email, codex_name'),
                supabase.from('sources').select('*')
            ])
            if (notesRes.data) setPublicNotes(notesRes.data as Note[])
            if (usersRes.data) setUsers(usersRes.data as UserProfile[])
            if (sourcesRes.data) setSources(sourcesRes.data)
        }
        loadAutocompleteData()
    }, [note.id, supabase, user, note.user_id, note.updated_at, note.title, note.content]) // Cleaned up deps

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
                let match: any = null
                if (mentionType === 'wiki') {
                    // Search Notes + Sources
                    const noteMatch = publicNotes.find(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase()) && n.id !== note.id)
                    if (noteMatch) {
                        match = noteMatch
                    } else {
                        match = sources.find(s => s.title.toLowerCase().includes(mentionQuery.toLowerCase()))
                    }
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

    // Caret Coordinates Logic
    const [caretCoords, setCaretCoords] = useState({ x: 0, y: 0 })

    const updateCaretCoords = () => {
        if (!textareaRef.current) return
        const { selectionStart } = textareaRef.current

        // Create a dummy div to mirror the textarea
        const div = document.createElement('div')
        const style = getComputedStyle(textareaRef.current)

        // Copy styles
        Array.from(style).forEach(prop => {
            div.style.setProperty(prop, style.getPropertyValue(prop))
        })

        div.style.position = 'absolute'
        div.style.top = '0'
        div.style.left = '-9999px' // Hide it
        div.style.visibility = 'hidden'
        div.style.whiteSpace = 'pre-wrap'
        div.textContent = textareaRef.current.value.substring(0, selectionStart)

        // Add a span for the caret
        const span = document.createElement('span')
        span.textContent = '|'
        div.appendChild(span)

        document.body.appendChild(div)

        const { offsetLeft, offsetTop } = span
        // Adjust for scroll
        const x = offsetLeft - textareaRef.current.scrollLeft
        const y = offsetTop - textareaRef.current.scrollTop

        document.body.removeChild(div)

        // Adjust relative to textarea container
        setCaretCoords({ x, y: y + 24 }) // +24 for line height approx
    }

    // Update coords on content change
    const innerHandleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleContentChange(e)
        requestAnimationFrame(updateCaretCoords)
    }

    const innerHandleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        handleKeyDown(e)
        // Update on navigation keys if needed? 
    }

    // RENDER
    return (
        <div className={cn("flex flex-col h-full relative", className)}>
            <PromoteNoteDialog
                open={showPromoteDialog}
                onOpenChange={setShowPromoteDialog}
                note={{ ...note, title, content }}
                onSuccess={(updatedNote) => {
                    if (onUpdate) onUpdate(updatedNote)
                }}
            />

            {/* Header / Toolbar */}
            <div className="p-4 border-b flex flex-col gap-4 bg-muted/5">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 w-full mr-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {note.type === 'fleeting' && <Badge variant="secondary"><Lightbulb className="h-3 w-3 mr-1" /> Inbox</Badge>}
                            {note.type === 'permanent' && <Badge variant="secondary"><Brain className="h-3 w-3 mr-1" /> Note</Badge>}
                            {note.type === 'source' && <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" /> Source</Badge>}
                            {/* Points Badge */}
                            {points > 0 && <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{points} XP</Badge>}
                            {/* Author Badge (if not owner) */}
                            {author && note.user_id !== user?.id && (
                                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                                    by {author.codex_name || author.email.split('@')[0]}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto sm:ml-0">{lastSaved.toLocaleDateString()}</span>
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
                                className={cn(
                                    "text-2xl font-bold leading-tight",
                                    note.type !== 'permanent' && isOwner && "cursor-pointer hover:underline decoration-dashed decoration-muted-foreground/30"
                                )}
                                onClick={() => isOwner && note.type !== 'permanent' && setIsEditing(true)}
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
                        {isOwner && note.type !== 'permanent' && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete} title="Delete Note">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        {isOwner && !isEditing && note.type !== 'permanent' && (
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
                    <div className="w-full h-full relative flex flex-col">
                        <Textarea
                            ref={textareaRef}
                            value={content}
                            onChange={innerHandleContentChange}
                            onKeyDown={innerHandleKeyDown}
                            className="w-full flex-1 resize-none p-6 border-none focus-visible:ring-0 font-mono text-sm leading-relaxed"
                            placeholder="Start writing..."
                        />

                        {/* Smart Suggestions */}
                        <div className="px-6 pb-4">
                            <SmartSuggestions
                                context={content}
                                currentId={note.id}
                                onLink={(title) => {
                                    const link = ` [[${title}]] `
                                    setContent(prev => prev + link)
                                    toast.success(`Linked to ${title}`)
                                }}
                                onOpen={(title) => {
                                    if (onLinkClick) onLinkClick(title)
                                }}
                            />
                        </div>

                        {/* Autocomplete Dropdown */}
                        {mentionQuery !== null && (
                            <div
                                className="absolute z-50 p-2 bg-popover text-popover-foreground rounded-md border shadow-md w-64 max-h-48 overflow-y-auto"
                                style={{
                                    top: `${Math.min(caretCoords.y, 400)}px`, // Clamp to avoid overflow? simplified.
                                    left: `${Math.min(caretCoords.x, 300)}px`, // Simple clamping
                                    transform: 'translate(24px, 0)' // Offset slightly
                                }}
                            >
                                <div className="text-xs font-semibold mb-2 text-muted-foreground">
                                    {mentionType === 'wiki' ? 'Link to Note' : 'Mention User'}
                                </div>
                                {(() => {
                                    let items: any[] = []
                                    if (mentionType === 'wiki') {
                                        const matchedNotes = publicNotes.filter(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase()) && n.id !== note.id)
                                        const matchedSources = sources.filter(s => s.title.toLowerCase().includes(mentionQuery.toLowerCase()))
                                        items = [...matchedSources, ...matchedNotes]
                                    } else {
                                        items = users.filter(u => u.email.toLowerCase().includes(mentionQuery.toLowerCase()) || (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery.toLowerCase())))
                                    }

                                    if (items.length === 0) return <div className="text-xs p-2 italic text-muted-foreground">No matches</div>

                                    return items.map((item: any) => (
                                        <button
                                            key={item.id}
                                            className="flex items-center w-full p-2 text-sm rounded-sm hover:bg-accent text-left"
                                            onClick={() => insertLink(item)}
                                        >
                                            {mentionType === 'wiki' ? (
                                                item.url !== undefined ? // Is Source (has url field, optional) or check type
                                                    <BookOpen className="h-3 w-3 mr-2 text-indigo-500" /> :
                                                    <ExternalLink className="h-3 w-3 mr-2" />
                                            ) : <ExternalLink className="h-3 w-3 mr-2" />}
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate">{item.title || item.codex_name || item.email}</span>
                                                {item.author && <span className="text-[10px] text-muted-foreground truncate">by {item.author}</span>}
                                            </div>
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
                            onClick={() => isOwner && note.type !== 'permanent' && setIsEditing(true)}
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    a: ({ href, children, ...props }) => {
                                        if (href?.startsWith('#wiki-')) {
                                            const title = decodeURIComponent(href.replace('#wiki-', ''))
                                            return (
                                                <span
                                                    className="text-blue-500 font-medium cursor-pointer hover:underline"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        if (onLinkClick) onLinkClick(title)
                                                    }}
                                                >
                                                    {children}
                                                </span>
                                            )
                                        }
                                        if (href?.startsWith('mention:')) {
                                            const name = href.replace('mention:', '')
                                            return (
                                                <span
                                                    className="text-green-600 font-semibold cursor-pointer hover:underline"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        // Find user ID
                                                        const targetUser = users.find(u =>
                                                            (u.codex_name?.replace(/\s+/g, '') || u.email.split('@')[0]) === name
                                                        )
                                                        if (targetUser) {
                                                            router.push(`/user/${targetUser.id}`)
                                                        } else {
                                                            toast.error("User not found")
                                                        }
                                                    }}
                                                >
                                                    {children}
                                                </span>
                                            )
                                        }
                                        return (
                                            <a
                                                href={href}
                                                {...props}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary underline hover:text-primary/80"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {children}
                                            </a>
                                        )
                                    },
                                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2 text-foreground">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-muted pl-4 italic my-2">{children}</blockquote>,
                                    code: ({ children, className }) => {
                                        const isBlock = /language-(\w+)/.test(className || '')
                                        return isBlock ? (
                                            <code className="block bg-muted p-2 rounded my-2 whitespace-pre overflow-x-auto text-xs">{children}</code>
                                        ) : (
                                            <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                                        )
                                    },
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
                                }}
                            >
                                {(() => {
                                    // Pre-process content for Wiki Links [[Title]] -> [Title](#wiki-Title)
                                    let processed = content || ''
                                    // Wiki Links - use non-greedy match for content inside brackets
                                    processed = processed.replace(/\[\[(.*?)\]\]/g, (match, title) => {
                                        return `[${title}](#wiki-${encodeURIComponent(title)})`
                                    })
                                    // Mentions @User -> [@User](mention:User)
                                    processed = processed.replace(/@(\w+)/g, (match, username) => {
                                        return `[${match}](mention:${username})`
                                    })
                                    return processed
                                })()}
                            </ReactMarkdown>
                        </div>
                    </ScrollArea>
                )}
            </div>

        </div >
    )
}
