'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Brain, BookOpen, Lightbulb, Save, Trash2, Edit2, ExternalLink, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateNote, deleteNote, promoteNote, getUserTags } from '@/lib/actions/notes'
import { addTag, removeTag } from '@/lib/actions/tags'
import { Database } from '@/types/database.types'
import { useAuth } from '@/components/auth-provider'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Note = Database['public']['Tables']['notes']['Row']
type UserProfile = { id: string, email: string, codex_name?: string }

import { PromoteNoteDialog } from './PromoteNoteDialog'
import { SmartSuggestions } from '@/components/SmartSuggestions'
import { RequestSourceDialog } from './RequestSourceDialog'
import { TagsInput } from '@/components/ui/tags-input'

interface NoteEditorProps {
    note: Note
    onUpdate?: (note: Note) => void
    onDelete?: () => void
    onLinkClick?: (title: string) => void
    onUserClick?: (userId: string) => void
    className?: string
}

export function NoteEditor({ note, onUpdate, onDelete, onLinkClick, onUserClick, className }: NoteEditorProps) {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    // Permission Check
    const isOwner = user?.id === note.user_id

    // State
    const [title, setTitle] = useState(note.title)
    const [content, setContent] = useState(note.content)
    const [tags, setTags] = useState<string[]>(note.tags || [])
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date>(new Date(note.updated_at))
    const [showPromoteDialog, setShowPromoteDialog] = useState(false)
    const [showRequestSourceDialog, setShowRequestSourceDialog] = useState(false)

    // Autocomplete State
    const [users, setUsers] = useState<UserProfile[]>([])
    const [publicNotes, setPublicNotes] = useState<Note[]>([])
    const [sources, setSources] = useState<any[]>([])
    const [userTags, setUserTags] = useState<string[]>([])
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionType, setMentionType] = useState<'wiki' | 'mention' | null>(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [author, setAuthor] = useState<{ email: string, codex_name?: string } | null>(null)


    // Force exit edit mode if note becomes permanent
    useEffect(() => {
        if (note.type === 'permanent') {
            setIsEditing(false)
        }
    }, [note.type])

    const [userUnlocks, setUserUnlocks] = useState<Set<string>>(new Set())

    // Load Data for Autocomplete & Meta
    useEffect(() => {
        setTitle(note.title)
        setContent(note.content)
        setTags(note.tags || [])
        setLastSaved(new Date(note.updated_at))

        const loadMeta = async () => {
            // ... existing meta load code ...
        }
        loadMeta()

        const loadAutocompleteData = async () => {
            const { getUnlocks } = await import('@/lib/actions/unlocks')
            const [notesRes, usersRes, textsRes, tagsRes, unlocksRes] = await Promise.all([
                supabase.from('notes').select('*').eq('is_public', true),
                supabase.from('users').select('id, email, codex_name'),
                supabase.from('texts').select('*').in('status', ['approved']),
                getUserTags(),
                getUnlocks(note.user_id)
            ])
            if (notesRes.data) setPublicNotes(notesRes.data as Note[])
            if (usersRes.data) setUsers(usersRes.data as UserProfile[])
            if (textsRes.data) setSources(textsRes.data)
            if (tagsRes) setUserTags(tagsRes)
            if (unlocksRes) setUserUnlocks(new Set(unlocksRes))
        }
        loadAutocompleteData()
    }, [note.id, supabase, user, note.user_id]) // Fixed race condition by removing mutable props from deps

    // Autosave
    useEffect(() => {
        if (!isOwner || !isEditing) return

        const timer = setTimeout(async () => {
            if (content !== note.content || title !== note.title) {
                setIsSaving(true)
                // Do not send tags here
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

    // Tag Handlers
    const handleAddTag = async (tag: string) => {
        // Optimistic
        if (!tags.includes(tag)) setTags([...tags, tag])

        const result = await addTag(note.id, tag)
        if (result.error) {
            toast.error("Failed to add tag")
            // Revert
            setTags(prev => prev.filter(t => t !== tag))
        } else {
            // Refresh user tags list to include new tag if unique
            if (!userTags.includes(tag)) setUserTags(prev => [...prev, tag])
        }
    }

    const handleRemoveTag = async (tag: string) => {
        // Optimistic
        setTags(prev => prev.filter(t => t !== tag))

        const result = await removeTag(note.id, tag)
        if (result.error) {
            toast.error("Failed to remove tag")
            // Revert
            setTags(prev => [...prev, tag])
        }
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
                        match = sources.find(s =>
                            s.title.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                            s.author?.toLowerCase().includes(mentionQuery.toLowerCase())
                        )
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
                            {/* Author Badge (if not owner) */}
                            {author && note.user_id !== user?.id && (
                                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                                    by {author.codex_name || author.email.split('@')[0]}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto sm:ml-0">{lastSaved.toLocaleDateString()}</span>
                        </div>

                        {/* Tags Input (Always Visible) */}
                        <div className="mb-2">
                            <TagsInput
                                value={tags}
                                onAddTag={handleAddTag}
                                onRemoveTag={handleRemoveTag}
                                onChange={setTags}
                                suggestions={userTags}
                                disabled={note.type === 'permanent'}
                                onTagClick={(tag) => router.push(`/my-notes?tag=${tag}`)}
                            />
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
                        {userUnlocks.has('smart_connections') && (
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
                        )}

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
                                        const matchedSources = sources.filter(s =>
                                            s.title?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                                            s.author?.toLowerCase().includes(mentionQuery.toLowerCase())
                                        )
                                        items = [...matchedSources, ...matchedNotes]
                                    } else {
                                        items = users.filter(u => u.email.toLowerCase().includes(mentionQuery.toLowerCase()) || (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery.toLowerCase())))
                                    }

                                    if (items.length === 0 && mentionType === 'wiki') {
                                        return (
                                            <button
                                                className="flex items-center w-full p-2 text-sm rounded-sm hover:bg-accent text-left text-primary font-medium"
                                                onClick={() => setShowRequestSourceDialog(true)}
                                            >
                                                <Plus className="h-3 w-3 mr-2" />
                                                Request New Source: "{mentionQuery}"
                                            </button>
                                        )
                                    }

                                    if (items.length === 0) return <div className="text-xs p-2 italic text-muted-foreground">No matches</div>

                                    return (
                                        <>
                                            {items.map((item: any) => (
                                                <button
                                                    key={item.id}
                                                    className="flex items-center w-full p-2 text-sm rounded-sm hover:bg-accent text-left"
                                                    onClick={() => insertLink(item)}
                                                >
                                                    {mentionType === 'wiki' ? (
                                                        item.type === 'book' ? <BookOpen className="h-3 w-3 mr-2 text-indigo-500" /> :
                                                            item.url ? <ExternalLink className="h-3 w-3 mr-2 text-indigo-500" /> :
                                                                <Lightbulb className="h-3 w-3 mr-2" />
                                                    ) : <ExternalLink className="h-3 w-3 mr-2" />}
                                                    <div className="flex flex-col overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate">{item.title || item.codex_name || item.email}</span>
                                                            {item.status === 'pending' && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-3 uppercase bg-yellow-50 text-yellow-600 border-yellow-200">
                                                                    Pending
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {item.author && <span className="text-[10px] text-muted-foreground truncate">by {item.author}</span>}
                                                    </div>
                                                </button>
                                            ))}
                                            {mentionType === 'wiki' && (
                                                <button
                                                    className="flex items-center w-full p-2 mt-2 text-xs rounded-sm hover:bg-accent text-left text-muted-foreground border-t pt-2"
                                                    onClick={() => setShowRequestSourceDialog(true)}
                                                >
                                                    <Plus className="h-3 w-3 mr-2" />
                                                    Can't find it? Request a source...
                                                </button>
                                            )}
                                        </>
                                    )
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
                                                            if (onUserClick) {
                                                                onUserClick(targetUser.id)
                                                            } else {
                                                                router.push(`/user/${targetUser.id}`)
                                                            }
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

            <RequestSourceDialog
                open={showRequestSourceDialog}
                onOpenChange={setShowRequestSourceDialog}
                initialTitle={mentionQuery || ''}
                onSuccess={(newSource) => {
                    setSources(prev => [...prev, newSource])
                    insertLink(newSource)
                }}
            />

        </div >
    )
}
