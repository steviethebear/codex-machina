'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Sparkles, Link as LinkIcon, Database, Tag as TagIcon, X } from 'lucide-react'
import { getSuggestions, SuggestionNote } from '@/lib/llm/get-suggestions'
import { cn } from '@/lib/utils'
import { NoteXPDisplay } from '@/components/notebook/note-xp-display'

type NoteMetadata = {
    created_at: string
    author: string | null
    moderation_status: 'draft' | 'pending' | 'flagged' | 'approved' | 'rejected' | null
    moderation_result: string | null
}

type CreationAction = {
    xp: number
    sp_thinking: number
    sp_reading: number
    sp_writing: number
    sp_engagement: number
}

type SuggestionsPanelProps = {
    noteId: string | null
    noteText: string
    tags: string[]
    isOpen: boolean
    onToggle: () => void
    onConnect: (suggestion: SuggestionNote) => void
    onAddTag: (tag: string) => void
    onRemoveTag: (tag: string) => void
    allTags: string[]
    metadata: NoteMetadata | null
    userId: string
    creationAction: CreationAction | null
}

type Tab = 'suggestions' | 'data'

export function SuggestionsPanel({
    noteId,
    noteText,
    tags,
    isOpen,
    onToggle,
    onConnect,
    onAddTag,
    onRemoveTag,
    allTags,
    metadata,
    userId,
    creationAction
}: SuggestionsPanelProps) {
    const [suggestions, setSuggestions] = useState<SuggestionNote[]>([])
    const [loading, setLoading] = useState(false)
    const [lastSearchedText, setLastSearchedText] = useState('')
    const [activeTab, setActiveTab] = useState<Tab>('suggestions')
    const [tagInput, setTagInput] = useState('')

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

    const handleTagSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (tagInput.trim()) {
                onAddTag(tagInput.trim())
                setTagInput('')
            }
        }
    }

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
            <div className="h-full flex flex-col bg-[#1a1a1a]">
                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'suggestions'
                                ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                        )}
                    >
                        <Sparkles className="w-4 h-4" />
                        Suggestions
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'data'
                                ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                        )}
                    >
                        <Database className="w-4 h-4" />
                        Data
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'suggestions' ? (
                        <>
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
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
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* Note Information Section */}
                            {metadata && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Database className="w-3.5 h-3.5" />
                                        Note Info
                                    </h3>

                                    <div className="space-y-3 text-xs">
                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">Status:</span>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider",
                                                metadata.moderation_status === 'draft'
                                                    ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                                                    : metadata.moderation_status === 'rejected'
                                                        ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                                                        : 'bg-green-500/20 text-green-200 border border-green-500/30'
                                            )}>
                                                {metadata.moderation_status || 'Approved'}
                                            </div>
                                        </div>

                                        {/* Rejection Reason */}
                                        {metadata.moderation_status === 'rejected' && metadata.moderation_result && (
                                            <div className="p-2 bg-red-900/20 border border-red-500/30 rounded text-red-200 text-xs">
                                                <span className="font-semibold">Rejection Reason: </span>
                                                {metadata.moderation_result}
                                            </div>
                                        )}

                                        {/* Date and Author */}
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <span className="text-gray-500">Created:</span>
                                            <span>{new Date(metadata.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {metadata.author && (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <span className="text-gray-500">Author:</span>
                                                <span>{metadata.author}</span>
                                            </div>
                                        )}

                                        {/* XP Earned Display */}
                                        {noteId && userId && (
                                            <div className="pt-2 border-t border-gray-800">
                                                <NoteXPDisplay noteId={noteId} userId={userId} />
                                            </div>
                                        )}

                                        {/* Creation Rewards */}
                                        {creationAction && (
                                            <div className="pt-2 border-t border-gray-800">
                                                <div className="text-gray-500 mb-2">Rewards Earned:</div>
                                                <div className="flex flex-wrap gap-2 text-xs font-medium">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded">+{creationAction.xp} XP</span>
                                                    {creationAction.sp_thinking > 0 && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">+{creationAction.sp_thinking} Thinking</span>}
                                                    {creationAction.sp_reading > 0 && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">+{creationAction.sp_reading} Reading</span>}
                                                    {creationAction.sp_writing > 0 && <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">+{creationAction.sp_writing} Writing</span>}
                                                    {creationAction.sp_engagement > 0 && <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded">+{creationAction.sp_engagement} Engagement</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tags Section */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <TagIcon className="w-3.5 h-3.5" />
                                    Tags
                                </h3>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-[#2d2d30] text-gray-300 text-xs rounded-md flex items-center gap-1 group border border-gray-700"
                                        >
                                            #{tag}
                                            <button
                                                onClick={() => onRemoveTag(tag)}
                                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagSubmit}
                                        placeholder="Add a tag..."
                                        className="w-full bg-[#252525] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        list="sidebar-tag-suggestions"
                                    />
                                    <datalist id="sidebar-tag-suggestions">
                                        {allTags.map(tag => (
                                            <option key={tag} value={tag} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
