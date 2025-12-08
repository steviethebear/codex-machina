'use client'

import { QuestionWithAuthor } from '@/lib/actions/questions/get-questions'
import { cn } from '@/lib/utils'
import { MessageCircle, CheckCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QuestionCardProps {
    question: QuestionWithAuthor
    onSelect: (question: QuestionWithAuthor) => void
}

export function QuestionCard({ question, onSelect }: QuestionCardProps) {
    const isResolved = question.is_resolved

    return (
        <div
            className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50 bg-card border-border",
                isResolved && "opacity-75"
            )}
            onClick={() => onSelect(question)}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    {isResolved ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <h3 className="font-medium line-clamp-1">{question.title}</h3>
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-primary/80">
                        {question.author?.codex_name || 'Unknown Scholar'}
                    </span>
                    <span>•</span>
                    <span>
                        {formatDistanceToNow(new Date(question.created_at || ''), { addSuffix: true })}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{question.view_count || 0}</span>
                </div>
            </div>
        </div>
    )
}
