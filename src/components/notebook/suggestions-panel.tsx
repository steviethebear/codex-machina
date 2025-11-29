'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Sparkles, Link as LinkIcon } from 'lucide-react'
import { getSuggestions, SuggestionNote } from '@/lib/llm/get-suggestions'

type SuggestionsPanelProps = {
    noteId: string | null
    noteText: string
    tags: string[]
    isOpen: boolean
    onToggle: () => void
    onConnect: (suggestion: SuggestionNote) => void
}

export function SuggestionsPanel({
    noteId,
    noteText,
    tags,
    isOpen,
    onToggle,
    onConnect
}: SuggestionsPanelProps) {
    const [suggestions, setSuggestions] = useState<SuggestionNote[]>([])
    const [loading, setLoading] = useState(false)
    const [lastSearchedText, setLastSearchedText] = useState('')

    // Reset cache when switching notes
    useEffect(() => {
        setLastSearchedText('')
    }, [noteId])

    // Fetch suggestions when note text or tags change (debounced)
    useEffect(() => {
        // Don't fetch for very short content
        if (noteText.trim().length < 20) {
            setSuggestions([])
            return
        }

        // Skip if text hasn't changed significantly (less than 50 chars difference)
        const textDiff = Math.abs(noteText.length - lastSearchedText.length)
        const textChanged = textDiff > 50 ||
            (lastSearchedText.length > 0 && !noteText.includes(lastSearchedText.slice(0, 50)))

        if (lastSearchedText.length > 0 && !textChanged) {
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const results = await getSuggestions(noteId, noteText, tags, 5)
                setSuggestions(results)
                setLastSearchedText(noteText)
            } catch (error) {
                console.error('[SuggestionsPanel] Failed to fetch suggestions:', error)
                setSuggestions([])
            } finally {
                setLoading(false)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [noteText, tags, noteId])

    return (
        <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-[#1a1a1a] border-l border-gray-800 transition-all duration-300 ease-in-out z-40 ${isOpen ? 'w-80 lg:w-96' : 'w-0'
            } overflow-hidden`}>
            {/* Toggle Button - always visible */}
            <button
                onClick={onToggle}
                className={`fixed top-20 ${isOpen ? 'right-[320px] lg:right-[384px]' : 'right-0'} w-8 h-12 bg-[#1a1a1a] border border-gray-800 ${isOpen ? 'border-r-0 rounded-l-lg' : 'border-r-0 rounded-l-lg'} flex items-center justify-center hover:bg-gray-900 transition-all duration-300 z-50`}
                aria-label={isOpen ? 'Close suggestions' : 'Open suggestions'}
                style={{ right: isOpen ? undefined : '0px' }} // Force right: 0 when closed
            >
                {isOpen ? (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {/* Panel Content */}
            <div className="h-full flex flex-col p-4 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-200">
                        The Machine sees possible connections…
                    </h3>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && suggestions.length === 0 && noteText.trim().length >= 20 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Sparkles className="w-8 h-8 text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500 italic">
                            The Machine awaits more knowledge before recommending.
                        </p>
                    </div>
                )}

                {/* Too Short Message */}
                {!loading && noteText.trim().length < 20 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-xs text-gray-600 italic">
                            Write a bit more to see suggestions...
                        </p>
                    </div>
                )}

                {/* Suggestions List */}
                {!loading && suggestions.length > 0 && (
                    <div className="space-y-3">
                        {suggestions.map((suggestion) => (
                            <SuggestionCard
                                key={suggestion.id}
                                suggestion={suggestion}
                                onConnect={onConnect}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

type SuggestionCardProps = {
    suggestion: SuggestionNote
    onConnect: (suggestion: SuggestionNote) => void
}

function SuggestionCard({ suggestion, onConnect }: SuggestionCardProps) {
    const snippet = suggestion.body.length > 120
        ? suggestion.body.slice(0, 120) + '...'
        : suggestion.body

    return (
        <div className="bg-[#252525] rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-colors group">
            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-200 mb-1.5 line-clamp-2">
                {suggestion.title}
            </h4>

            {/* Snippet */}
            <p className="text-xs text-gray-500 mb-2 line-clamp-3">
                {snippet}
            </p>

            {/* Tags */}
            {suggestion.tags && suggestion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {suggestion.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Connect Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onConnect(suggestion)}
                className="w-full text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 border border-blue-500/30 group-hover:border-blue-500/50"
            >
                <LinkIcon className="w-3 h-3 mr-1" />
                Connect
            </Button>

            {/* Debug: Show similarity score in dev */}
            {process.env.NODE_ENV === 'development' && suggestion.similarity != null && (
                <div className="mt-1 text-xs text-gray-700">
                    Score: {suggestion.score.toFixed(2)} (sim: {suggestion.similarity.toFixed(2)})
                </div>
            )}
        </div>
    )
}
