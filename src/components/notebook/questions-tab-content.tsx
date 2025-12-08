'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { getQuestions, QuestionWithAuthor } from '@/lib/actions/questions/get-questions'
import { QuestionDetail } from '@/components/questions/question-detail'
import { QuestionComposer } from '@/components/questions/question-composer'
import { EmptyState } from './empty-state'
import { NotebookLayout } from './notebook-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Loader2, Search, ChevronRight, CheckCircle, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type QuestionFilter = 'all' | 'mine' | 'answered' | 'unanswered'
type Text = Database['public']['Tables']['texts']['Row']

interface QuestionsTabContentProps {
    preselectedQuestionId?: string | null
}

export function QuestionsTabContent({ preselectedQuestionId }: QuestionsTabContentProps) {
    const { user } = useAuth()
    const [questions, setQuestions] = useState<QuestionWithAuthor[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithAuthor | null>(null)
    const [isComposing, setIsComposing] = useState(false)
    const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set())
    const [texts, setTexts] = useState<Text[]>([])

    // Sidebar state
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<QuestionFilter>('all')
    const [showFilters, setShowFilters] = useState(false)
    const [showTexts, setShowTexts] = useState(false)
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null)

    const fetchQuestions = async () => {
        if (!user) return
        try {
            const data = await getQuestions(user.id)
            setQuestions(data)

            // Fetch questions that the user has answered
            const supabase = createClient()
            const { data: userReplies } = await supabase
                .from('links')
                .select('to_question_id')
                .eq('relation_type', 'reply')
                .not('to_question_id', 'is', null)
                .in('from_note_id', (
                    await supabase
                        .from('atomic_notes')
                        .select('id')
                        .eq('author_id', user.id)
                ).data?.map(n => n.id) || [])

            if (userReplies) {
                setAnsweredQuestionIds(new Set(userReplies.map(r => r.to_question_id).filter(Boolean) as string[]))
            }

            // Fetch texts
            const { data: textsData } = await supabase
                .from('texts')
                .select('*')
                .eq('archived', false)
                .order('title')

            if (textsData) {
                setTexts(textsData)
            }

            // Handle preselection
            if (preselectedQuestionId) {
                const preselected = data.find(q => q.id === preselectedQuestionId)
                if (preselected) {
                    setSelectedQuestion(preselected)
                }
            }
        } catch (error) {
            console.error('Error fetching questions:', error)
            toast.error('Failed to load questions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQuestions()
    }, [user])

    // Filter questions
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.body.toLowerCase().includes(searchQuery.toLowerCase())

        if (!matchesSearch) return false

        // Text filter
        if (selectedTextId && q.text_id !== selectedTextId) return false

        switch (filter) {
            case 'mine':
                return q.author_id === user?.id
            case 'answered':
                return answeredQuestionIds.has(q.id)
            case 'unanswered':
                return !answeredQuestionIds.has(q.id)
            default:
                return true
        }
    })

    if (loading) {
        return (
            <NotebookLayout sidebar={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </NotebookLayout>
        )
    }

    const sidebar = (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* New Question Button */}
            <div className="p-3 border-b border-gray-800">
                <Button
                    onClick={() => {
                        setIsComposing(true)
                        setSelectedQuestion(null)
                    }}
                    className="w-full"
                    size="sm"
                    variant="outline"
                >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ask Question
                </Button>
            </div>

            {/* Search Field */}
            <div className="p-3 border-b border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9 text-sm"
                    />
                </div>
            </div>

            {/* All Questions Filter */}
            <div className="p-2 border-b border-gray-800 space-y-0.5">
                <button
                    onClick={() => {
                        setFilter('all')
                        setSelectedTextId(null)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${filter === 'all' && !selectedTextId
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                >
                    <span>All Questions</span>
                    <span className="text-xs opacity-70">{questions.length}</span>
                </button>
            </div>

            {/* Texts Section (Collapsible) */}
            <div className="border-b border-gray-800">
                <button
                    onClick={() => setShowTexts(!showTexts)}
                    className="w-full p-3 flex items-center justify-between text-sm font-semibold text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                    <span>TEXTS</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${showTexts ? 'rotate-90' : ''}`} />
                </button>
                {showTexts && (
                    <div className="p-2 pb-3 space-y-0.5">
                        {texts.map(text => {
                            const textQuestionCount = questions.filter(q => q.text_id === text.id).length
                            return (
                                <button
                                    key={text.id}
                                    onClick={() => setSelectedTextId(text.id)}
                                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${selectedTextId === text.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    <span className="truncate">{text.title}</span>
                                    <span className="text-xs opacity-70 flex-shrink-0 ml-2">{textQuestionCount}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Filters Section (Collapsible) */}
            <div className="border-b border-gray-800">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full p-3 flex items-center justify-between text-sm font-semibold text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                    <span>FILTERS</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                </button>
                {showFilters && (
                    <div className="p-2 pb-3 space-y-0.5">
                        <button
                            onClick={() => setFilter('mine')}
                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${filter === 'mine'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            <span>My Questions</span>
                            <span className="text-xs opacity-70">{questions.filter(q => q.author_id === user?.id).length}</span>
                        </button>
                        <button
                            onClick={() => setFilter('answered')}
                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${filter === 'answered'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            <span>Answered</span>
                            <span className="text-xs opacity-70">{answeredQuestionIds.size}</span>
                        </button>
                        <button
                            onClick={() => setFilter('unanswered')}
                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${filter === 'unanswered'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            <span>Unanswered</span>
                            <span className="text-xs opacity-70">{questions.length - answeredQuestionIds.size}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <div className="flex-1">
                <div className="px-3 py-2 border-b border-gray-800">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</span>
                </div>

                {filteredQuestions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No matching questions' : 'No questions found'}
                    </div>
                ) : (
                    filteredQuestions.map(question => (
                        <button
                            key={question.id}
                            onClick={() => {
                                setSelectedQuestion(question)
                                setIsComposing(false)
                            }}
                            className={`w-full text-left p-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors ${selectedQuestion?.id === question.id ? 'bg-white/10' : ''
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {answeredQuestionIds.has(question.id) ? (
                                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <MessageCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                        )}
                                        <div className="font-medium text-sm line-clamp-2 text-foreground">
                                            {question.title}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                        <span className="font-medium text-primary/80 truncate max-w-[100px]">
                                            {question.author?.codex_name || 'Unknown'}
                                        </span>
                                        <span>•</span>
                                        <span className="flex-shrink-0">
                                            {formatDistanceToNow(new Date(question.created_at || ''), { addSuffix: true })}
                                        </span>
                                        {question.reply_count ? (
                                            <>
                                                <span>•</span>
                                                <span>{question.reply_count} replies</span>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )

    return (
        <NotebookLayout sidebar={sidebar}>
            {selectedQuestion ? (
                <QuestionDetail
                    question={selectedQuestion}
                    onClose={() => setSelectedQuestion(null)}
                    onUpdate={fetchQuestions}
                />
            ) : isComposing ? (
                <div className="p-6">
                    <QuestionComposer
                        onSuccess={() => {
                            setIsComposing(false)
                            fetchQuestions()
                        }}
                        onCancel={() => setIsComposing(false)}
                    />
                </div>
            ) : (
                <EmptyState
                    icon="❓"
                    title="Select a question"
                    description="Choose a question from the sidebar to view details and replies."
                />
            )}
        </NotebookLayout>
    )
}
