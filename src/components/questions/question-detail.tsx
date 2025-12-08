'use client'

import { useState } from 'react'
import { QuestionWithAuthor } from '@/lib/actions/questions/get-questions'
import { replyToQuestion } from '@/lib/actions/questions/reply-to-question'
import { resolveQuestion } from '@/lib/actions/questions/resolve-question'
import { getReplies, ReplyWithAuthor } from '@/lib/actions/questions/get-replies'
import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, MessageCircle, CheckCircle, Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface QuestionDetailProps {
    question: QuestionWithAuthor
    onClose: () => void
    onUpdate: () => void // Refresh parent list
}

import { useOracle } from '@/components/oracle/oracle-context'

export function QuestionDetail({ question, onClose, onUpdate }: QuestionDetailProps) {
    const { user } = useAuth()
    const { speak } = useOracle()
    const [replyBody, setReplyBody] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResolving, setIsResolving] = useState(false)
    const [replies, setReplies] = useState<ReplyWithAuthor[]>([])

    const isAuthor = user?.id === question.author_id
    const isResolved = question.is_resolved

    useEffect(() => {
        const fetchReplies = async () => {
            const data = await getReplies(question.id)
            setReplies(data)
        }
        fetchReplies()
    }, [question.id])

    const handleReply = async () => {
        if (!user || !replyBody.trim()) return

        setIsSubmitting(true)
        try {
            const result = await replyToQuestion(user.id, {
                questionId: question.id,
                body: replyBody
            })

            if (result.success) {
                toast.success('Reply posted')
                setReplyBody('')
                // Refresh replies
                const data = await getReplies(question.id)
                setReplies(data)
                onUpdate()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error('Error replying:', error)
            toast.error('Failed to post reply')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResolve = async (atomId?: string) => {
        if (!user || !isAuthor) return

        setIsResolving(true)
        try {
            const result = await resolveQuestion(user.id, question.id, atomId)
            if (result.success) {
                toast.success(result.message)
                if (result.oracleMessage) {
                    speak(result.oracleMessage, 'feedback')
                }
                onUpdate()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error('Error resolving:', error)
            toast.error('Failed to resolve question')
        } finally {
            setIsResolving(false)
        }
    }

    return (
        <div className="h-full flex flex-col bg-background border-l border-border">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {isResolved && <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Resolved</Badge>}
                        <span className="text-xs text-muted-foreground">
                            Posted {formatDistanceToNow(new Date(question.created_at || ''), { addSuffix: true })}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold">{question.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-primary">{question.author?.codex_name}</span>
                        {question.texts?.title && (
                            <>
                                <span>in</span>
                                <span className="italic">{question.texts.title}</span>
                            </>
                        )}
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                    <p>{question.body}</p>
                </div>

                {/* Replies Section (Placeholder for now, would fetch linked atoms) */}
                {/* Replies Section */}
                <div className="pt-6">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Replies ({replies.length})
                    </h3>

                    {/* Replies List */}
                    <div className="space-y-4 mb-6">
                        {replies.map(reply => (
                            <div key={reply.id} className="p-4 rounded-lg bg-muted/30 border border-border">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm text-primary">
                                        {reply.author?.codex_name || 'Unknown Scholar'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reply.created_at || ''), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reply.body}</p>

                                {isAuthor && !isResolved && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 h-6 text-xs hover:text-green-500 hover:bg-green-500/10"
                                        onClick={() => handleResolve(reply.id)}
                                        disabled={isResolving}
                                    >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Accept Answer
                                    </Button>
                                )}

                                {question.accepted_atom_id === reply.id && (
                                    <div className="mt-2 flex items-center text-xs text-green-500 font-medium">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Accepted Answer
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Reply Composer */}
                    <div className="flex gap-3">
                        <Textarea
                            placeholder="Write a reply..."
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            className="min-h-[80px]"
                        />
                        <Button
                            size="icon"
                            className="h-[80px] w-[50px]"
                            onClick={handleReply}
                            disabled={isSubmitting || !replyBody.trim()}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
