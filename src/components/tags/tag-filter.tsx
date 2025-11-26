'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Database } from '@/types/database.types'
import { TagBadge } from '../notes/tag-badge'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagFilterProps {
    availableTags: Tag[]
    selectedTags: Tag[]
    onTagsChange: (tags: Tag[]) => void
}

export function TagFilter({ availableTags, selectedTags, onTagsChange }: TagFilterProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleTag = (tag: Tag) => {
        if (selectedTags.some(t => t.id === tag.id)) {
            onTagsChange(selectedTags.filter(t => t.id !== tag.id))
        } else {
            onTagsChange([...selectedTags, tag])
        }
    }

    const clearAll = () => {
        onTagsChange([])
    }

    if (availableTags.length === 0) {
        return null
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Filter by Tags</label>
                {selectedTags.length > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Selected tags display */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                        <TagBadge
                            key={tag.id}
                            tag={tag}
                            onRemove={() => toggleTag(tag)}
                            variant="interactive"
                        />
                    ))}
                </div>
            )}

            {/* Tag selection dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left px-3 py-2 text-sm border rounded-md bg-background hover:bg-accent transition-colors"
                >
                    {selectedTags.length === 0
                        ? 'Select tags...'
                        : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`}
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                            {availableTags.map(tag => {
                                const isSelected = selectedTags.some(t => t.id === tag.id)
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => toggleTag(tag)}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between ${isSelected ? 'bg-accent' : ''
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{tag.display_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({tag.usage_count})
                                            </span>
                                        </span>
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
