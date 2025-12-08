'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { getNote } from '@/lib/actions/notes'
import { getComments, createComment, forkNote } from '@/lib/actions/collaboration'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { User, Copy, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // In Next.js 15, params is a promise we need to unwrap
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()

    const [note, setNote] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [commentText, setCommentText] = useState('')
    const [isForking, setIsForking] = useState(false)
    const [isCommenting, setIsCommenting] = useState(false)

    const loadData = async () => {
        // Fetch Note
        const { data: noteData, error: noteError } = await getNote(id)
        if (noteError) {
            console.error('Error loading note:', noteError)
            return
        }
        setNote(noteData)

        // Fetch Comments
        const { data: commentsData } = await getComments(id)
        if (commentsData) setComments(commentsData)

        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [id])

    const handleFork = async () => {
        setIsForking(true)
        const { data, error } = await forkNote(id)
        if (error) {
            alert('Error forking note: ' + error)
            setIsForking(false)
        } else {
            // Redirect happens via revalidatePath usually but here we might want to go to the new note?
            // Action returns data: newNote.
            // Let's redirect to 'My Notes' or the new note.
            // Action revalidated /my-notes.
            if (data) {
                router.push('/my-notes')
            }
        }
    }

    const handleComment = async () => {
        if (!commentText.trim()) return
        setIsCommenting(true)
        const { data, error } = await createComment(id, commentText)
        if (error) {
            alert('Error posting comment: ' + error)
        } else {
            setCommentText('')
            loadData() // Reload comments
        }
        setIsCommenting(false)
    }

    if (loading) return <div className="p-8">Loading note...</div>
    if (!note) return <div className="p-8">Note not found.</div>

    return (
        <div className="max-w-3xl mx-auto p-8">
            <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground mb-6 hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>

            <Card className="mb-8">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold mb-2">{note.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{note.user?.codex_name || 'Unknown Author'}</span>
                                <span>•</span>
                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="capitalize">{note.type}</Badge>
                            {user && user.id !== note.user_id && (
                                <Button size="sm" variant="secondary" onClick={handleFork} disabled={isForking}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    {isForking ? 'Forking...' : 'Fork Note'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>

                    {note.type === 'literature' && note.citation && (
                        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
                            <strong>Source:</strong> {note.citation} {note.page_number && `(p. ${note.page_number})`}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Comments Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Discussion ({comments.length})
                </h3>

                <div className="space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-sm">{comment.user?.codex_name || 'Anonymous'}</span>
                                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    ))}

                    {comments.length === 0 && (
                        <p className="text-muted-foreground italic">No comments yet.</p>
                    )}
                </div>

                <div className="flex gap-2 items-start mt-6">
                    <Textarea
                        placeholder="Add to the discussion..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <Button onClick={handleComment} disabled={isCommenting}>
                        Post
                    </Button>
                </div>
            </div>
        </div>
    )
}
