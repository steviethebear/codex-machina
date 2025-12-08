'use client'

import { QuestionWithAuthor } from '@/lib/actions/questions/get-questions'
import { QuestionCard } from './question-card'

interface QuestionListProps {
    questions: QuestionWithAuthor[]
    onSelect: (question: QuestionWithAuthor) => void
}

export function QuestionList({ questions, onSelect }: QuestionListProps) {
    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No questions yet. Be the first to ask!
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {questions.map(question => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    onSelect={onSelect}
                />
            ))}
        </div>
    )
}
