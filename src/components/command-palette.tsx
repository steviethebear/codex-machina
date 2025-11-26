'use client'

import { useEffect, useState } from 'react'
import { Search, Hash, Calendar } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MarkdownRenderer } from '@/components/markdown/renderer'

interface Note {
    id: string
    title: string
    body: string
    type: string
    created_at: string
    [key: string]: any  // Allow additional properties
}

interface CommandPaletteProps<T extends Note> {
    open: boolean
    onOpenChange: (open: boolean) => void
    notes: T[]
    onSelectNote: (note: T) => void
}

export function CommandPalette<T extends Note>({ open, onOpenChange, notes, onSelectNote }: CommandPaletteProps<T>) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Filter notes based on query
    const filteredNotes = notes.filter(note => {
        const searchText = query.toLowerCase()
        return (
            note.title.toLowerCase().includes(searchText) ||
            note.body.toLowerCase().includes(searchText) ||
            note.type.toLowerCase().includes(searchText)
        )
    }).slice(0, 10) // Limit to 10 results

    // Reset when dialog opens/closes
    useEffect(() => {
        if (open) {
            setQuery('')
            setSelectedIndex(0)
        }
    }, [open])

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, filteredNotes.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
            } else if (e.key === 'Enter' && filteredNotes.length > 0) {
                e.preventDefault()
                const selectedNote = filteredNotes[selectedIndex]
                if (selectedNote) {
                    onSelectNote(selectedNote)
                    onOpenChange(false)
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, filteredNotes, selectedIndex, onSelectNote, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <div className="w-full max-w-2xl max-h-[600px] overflow-hidden bg-card rounded-lg p-0">
                {/* Search Input */}
                <div className="border-b border-gray-800 px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search notes... (type to filter)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-8 border-0 focus-visible:ring-0 bg-transparent text-base"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="overflow-y-auto max-h-[500px]">
                    {filteredNotes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {query ? 'No notes found' : 'Start typing to search...'}
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredNotes.map((note, index) => (
                                <button
                                    key={note.id}
                                    onClick={() => {
                                        onSelectNote(note)
                                        onOpenChange(false)
                                    }}
                                    className={`w-full text-left px-4 py-3 transition-colors ${index === selectedIndex
                                        ? 'bg-primary/10 border-l-2 border-primary'
                                        : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                                        }`}
                                >
                                    <div className="font-medium mb-1 line-clamp-1">
                                        <MarkdownRenderer
                                            content={note.title}
                                            className="prose-p:inline prose-p:m-0"
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500 line-clamp-2 mb-2">
                                        {note.body.substring(0, 150)}...
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Hash className="h-3 w-3" />
                                            <span className="capitalize">{note.type}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {new Date(note.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="border-t border-gray-800 px-4 py-2 text-xs text-gray-600 flex items-center gap-4">
                    <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑↓</kbd> Navigate</span>
                    <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd> Select</span>
                    <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd> Close</span>
                </div>
            </div>
        </Dialog>
    )
}
