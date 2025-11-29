'use client'

import { useState, useEffect } from 'react'
import { X, Link as LinkIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['atomic_notes']['Row']

interface LinkingModalProps {
    isOpen: boolean
    onClose: () => void
    currentNoteId: string
    currentNoteTitle: string
    allNotes: Note[]
    allTexts: { id: string; title: string }[]
    onCreateLink: (targetNoteId: string | null, targetTextId: string | null, explanation: string) => Promise<void>
    preselectedTarget?: { id: string; title: string } | null
}

export function LinkingModal({
    isOpen,
    onClose,
    currentNoteId,
    currentNoteTitle,
    allNotes,
    allTexts,
    onCreateLink,
    preselectedTarget
}: LinkingModalProps) {
    const [selectedTarget, setSelectedTarget] = useState<{ type: 'note' | 'text'; id: string; title: string } | null>(
        preselectedTarget ? { type: 'note', id: preselectedTarget.id, title: preselectedTarget.title } : null
    )
    const [searchQuery, setSearchQuery] = useState(preselectedTarget?.title || '')
    const [explanation, setExplanation] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [preselectedNoteBody, setPreselectedNoteBody] = useState<string>('')

    // Fetch full note data if preselected target isn't in allNotes
    useEffect(() => {
        const fetchPreselectedNote = async () => {
            if (preselectedTarget && selectedTarget?.type === 'note') {
                // Check if note is already in allNotes
                const existingNote = allNotes.find(n => n.id === preselectedTarget.id)
                if (existingNote?.body) {
                    setPreselectedNoteBody(existingNote.body)
                } else {
                    // Fetch from Supabase
                    const supabase = (await import('@/lib/supabase/client')).createClient()
                    const { data } = await supabase
                        .from('atomic_notes')
                        .select('body')
                        .eq('id', preselectedTarget.id)
                        .single()

                    if (data?.body) {
                        setPreselectedNoteBody(data.body)
                    }
                }
            }
        }
        fetchPreselectedNote()
    }, [preselectedTarget, allNotes])

    // Update state if preselectedTarget changes
    useEffect(() => {
        if (preselectedTarget) {
            setSelectedTarget({
                type: 'note',
                id: preselectedTarget.id,
                title: preselectedTarget.title
            })
            setSearchQuery(preselectedTarget.title)
        }
    }, [preselectedTarget])

    // Filter out current note and search
    const filteredNotes = allNotes
        .filter(n => n.id !== currentNoteId)
        .filter(n => searchQuery === '' || n.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 10)

    const filteredTexts = allTexts
        .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 10)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTarget || !explanation.trim()) return

        setIsSubmitting(true)
        try {
            const targetNoteId = selectedTarget.type === 'note' ? selectedTarget.id : null
            const targetTextId = selectedTarget.type === 'text' ? selectedTarget.id : null
            await onCreateLink(targetNoteId, targetTextId, explanation)
            handleClose()
        } catch (error) {
            console.error('Error creating link:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setSearchQuery('')
        setSelectedTarget(null)
        setExplanation('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#252525] border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-gray-200">Create Connection</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {/* From */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">From</label>
                            <div className="text-sm text-gray-300 bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2">
                                {currentNoteTitle}
                            </div>
                        </div>

                        {/* Search Target */}
                        {!selectedTarget && (
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">To (Note or Text)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Search for note or text..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-[#1e1e1e] border-gray-700 text-gray-200"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* Selected Target */}
                        {selectedTarget && (
                            <div className="bg-blue-600/10 border border-blue-600/30 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-blue-400 uppercase font-medium">
                                            {selectedTarget.type}
                                        </span>
                                        <p className="text-sm text-gray-200 mt-1 font-medium">{selectedTarget.title}</p>
                                        {/* Show full body */}
                                        {(() => {
                                            const body = selectedTarget.type === 'note'
                                                ? (preselectedNoteBody || allNotes.find(n => n.id === selectedTarget.id)?.body)
                                                : (allTexts.find(t => t.id === selectedTarget.id) as any)?.content

                                            return body ? (
                                                <div className="text-xs text-gray-400 mt-2 border-t border-blue-500/20 pt-2 max-h-60 overflow-y-auto whitespace-pre-wrap">
                                                    {body}
                                                </div>
                                            ) : null
                                        })()}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTarget(null)}
                                        className="text-gray-500 hover:text-gray-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {!selectedTarget && searchQuery.length > 0 && (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {filteredNotes.length > 0 && (
                                    <>
                                        <p className="text-xs text-gray-500 uppercase font-medium px-1">Notes</p>
                                        {filteredNotes.map(note => (
                                            <button
                                                key={note.id}
                                                type="button"
                                                onClick={() => setSelectedTarget({ type: 'note', id: note.id, title: note.title })}
                                                className="w-full text-left px-3 py-2 rounded hover:bg-gray-700/50 transition-colors"
                                            >
                                                <p className="text-sm text-gray-200">{note.title}</p>
                                                <p className="text-xs text-gray-500 truncate">{note.body.substring(0, 60)}...</p>
                                            </button>
                                        ))}
                                    </>
                                )}
                                {filteredTexts.length > 0 && (
                                    <>
                                        <p className="text-xs text-gray-500 uppercase font-medium px-1 mt-2">Texts</p>
                                        {filteredTexts.map(text => (
                                            <button
                                                key={text.id}
                                                type="button"
                                                onClick={() => setSelectedTarget({ type: 'text', id: text.id, title: text.title })}
                                                className="w-full text-left px-3 py-2 rounded hover:bg-gray-700/50 transition-colors"
                                            >
                                                <p className="text-sm text-gray-200">{text.title}</p>
                                            </button>
                                        ))}
                                    </>
                                )}
                                {filteredNotes.length === 0 && filteredTexts.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No results found</p>
                                )}
                            </div>
                        )}

                        {/* Explanation */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                                Connection Explanation <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder="Briefly explain how these ideas connect... (markdown supported)"
                                className="w-full bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedTarget || !explanation.trim() || isSubmitting}
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 border border-blue-500/30"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Connection'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
