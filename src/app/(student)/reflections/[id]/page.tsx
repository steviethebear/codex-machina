'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getReflection, addMessage, completeReflection } from '@/lib/actions/reflections'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export default function ReflectionChatPage() {
    const { id } = useParams()
    const router = useRouter()
    const [reflection, setReflection] = useState<any>(null)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    const loadReflection = async () => {
        const res = await getReflection(id as string)
        if (res.error) {
            toast.error(res.error)
            router.push('/reflections')
        } else {
            setReflection(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadReflection()
    }, [id])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [reflection?.messages])

    const handleSend = async () => {
        if (!input.trim() || sending) return
        setSending(true)

        // Optimistic update? Maybe risky with AI. Let's just wait.
        const res = await addMessage(id as string, input)
        if (res.error) {
            toast.error(res.error)
        } else {
            // Update messages
            setReflection((prev: any) => ({
                ...prev,
                messages: res.data,
                status: 'in_progress'
            }))
            setInput('')
        }
        setSending(false)
    }

    const handleComplete = async () => {
        if (!confirm("Are you sure you want to finish this reflection?")) return
        const res = await completeReflection(id as string)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Reflection completed")
            loadReflection() // Refresh full state
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    if (!reflection) return <div>Not found</div>

    const isCompleted = reflection.status === 'completed'

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{reflection.context}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Started by {reflection.teacher?.codex_name || 'Teacher'}</span>
                            <Badge variant={isCompleted ? "secondary" : "outline"}>
                                {reflection.status.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                </div>
                {!isCompleted && (
                    <Button variant="outline" onClick={handleComplete} className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Finish Reflection
                    </Button>
                )}
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
                <div className="space-y-6 pb-4">
                    {reflection.messages.map((m: any, i: number) => (
                        <div key={i} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "")}>
                            <Avatar className={cn("h-8 w-8 mt-1", m.role === 'assistant' ? "bg-indigo-100" : "bg-muted")}>
                                <AvatarFallback className={m.role === 'assistant' ? "text-indigo-600" : ""}>
                                    {m.role === 'assistant' ? 'AI' : 'Me'}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "rounded-lg p-4 max-w-[80%] text-sm",
                                m.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                            )}>
                                <div className="prose dark:prose-invert text-sm max-w-none break-words">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                                <span className="text-[10px] opacity-70 mt-2 block">
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {sending && (
                        <div className="flex gap-4">
                            <Avatar className="h-8 w-8 bg-indigo-100">
                                <AvatarFallback className="text-indigo-600">AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Reflecting...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            {!isCompleted ? (
                <div className="flex gap-2 items-end pt-2">
                    <Textarea
                        placeholder="Type your reflection here..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        className="min-h-[60px] resize-none"
                    />
                    <Button
                        size="icon"
                        className="h-[60px] w-[60px] shrink-0"
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            ) : (
                <div className="text-center p-4 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">This reflection is complete. Thank you for articulating your thoughts.</p>
                </div>
            )}
        </div>
    )
}
