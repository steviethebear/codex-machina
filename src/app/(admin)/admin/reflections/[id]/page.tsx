'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getReflection } from '@/lib/actions/reflections'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export default function AdminReflectionDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [reflection, setReflection] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const res = await getReflection(id as string)
            if (res.error) {
                toast.error(res.error)
                router.push('/admin/reflections')
            } else {
                setReflection(res.data)
            }
            setLoading(false)
        }
        load()
    }, [id])

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    if (!reflection) return <div>Not found</div>

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4 md:p-6">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{reflection.context}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Student: {reflection.student?.codex_name || reflection.student?.email}</span>
                        <Badge variant={reflection.status === 'completed' ? "secondary" : "outline"}>
                            {reflection.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
                <div className="space-y-6 pb-4">
                    {reflection.messages.map((m: any, i: number) => (
                        <div key={i} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "")}>
                            <Avatar className={cn("h-8 w-8 mt-1", m.role === 'assistant' ? "bg-indigo-100" : "bg-muted")}>
                                <AvatarFallback className={m.role === 'assistant' ? "text-indigo-600" : ""}>
                                    {m.role === 'assistant' ? 'AI' : 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "rounded-lg p-4 max-w-[80%] text-sm",
                                m.role === 'user'
                                    ? "bg-slate-200 text-slate-900" // Teacher view: distinguish student but don't use primary color
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
                    {reflection.messages.length === 0 && (
                        <div className="text-center text-muted-foreground italic">No messages yet.</div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
