'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Database } from '@/types/database.types'
import { searchTags, getOrCreateTag } from '@/lib/tags/operations'
import { TagBadge } from './tag-badge'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagInputProps {
    selectedTags: Tag[]
    onTagsChange: (tags: Tag[]) => void
    userId: string
    placeholder?: string
}

export function TagInput({ selectedTags, onTagsChange, userId, placeholder = 'Add tags...' }: TagInputProps) {
    const [inputValue, setInputValue] = useState('')
    const [suggestions, setSuggestions] = useState<Tag[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Debounced search for suggestions
    useEffect(() => {
        if (!inputValue.trim()) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const timer = setTimeout(async () => {
            const results = await searchTags(inputValue)
            // Filter out already selected tags
            const filtered = results.filter(
                (tag) => !selectedTags.some((selected) => selected.id === tag.id)
            )
            setSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
            setSelectedIndex(0)
        }, 300)

        return () => clearTimeout(timer)
    }, [inputValue, selectedTags])

    const addTag = async (tag: Tag) => {
        if (!selectedTags.some((t) => t.id === tag.id)) {
            onTagsChange([...selectedTags, tag])
        }
        setInputValue('')
        setSuggestions([])
        setShowSuggestions(false)
        inputRef.current?.focus()
    }

    const createAndAddTag = async (displayName: string) => {
        const trimmed = displayName.trim()
        if (!trimmed) return

        const tag = await getOrCreateTag(trimmed, userId)
        if (tag) {
            addTag(tag)
        }
    }

    const removeTag = (tagId: string) => {
        onTagsChange(selectedTags.filter((t) => t.id !== tagId))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (showSuggestions && suggestions[selectedIndex]) {
                addTag(suggestions[selectedIndex])
            } else if (inputValue.trim()) {
                createAndAddTag(inputValue)
            }
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1].id)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Escape') {
            setShowSuggestions(false)
        }
    }

    return (
        <div className="relative">
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring">
                {selectedTags.map((tag) => (
                    <TagBadge
                        key={tag.id}
                        tag={tag}
                        onRemove={() => removeTag(tag.id)}
                    />
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue && setShowSuggestions(suggestions.length > 0)}
                    placeholder={selectedTags.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                />
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
                >
                    {suggestions.map((tag, index) => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${index === selectedIndex ? 'bg-accent' : ''
                                }`}
                        >
                            <span className="font-medium">{tag.display_name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({tag.usage_count} {tag.usage_count === 1 ? 'use' : 'uses'})
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {inputValue && !showSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-pop over border rounded-md shadow-lg">
                    <button
                        type="button"
                        onClick={() => createAndAddTag(inputValue)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                    >
                        Create tag "<span className="font-medium">{inputValue}</span>"
                    </button>
                </div>
            )}
        </div>
    )
}
