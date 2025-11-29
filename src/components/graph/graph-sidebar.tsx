'use client'

import { Search, User, X, ExternalLink, Network, ArrowLeft, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { TagFilter } from '@/components/tags/tag-filter'
import { Database } from '@/types/database.types'

type Tag = Database['public']['Tables']['tags']['Row']

interface GraphSidebarProps {
    // Filter props
    searchText: string
    onSearchChange: (text: string) => void
    activeTypeFilter: string | null
    onTypeFilterChange: (type: string | null) => void
    showMyAtomsOnly: boolean
    onShowMyAtomsOnlyChange: (show: boolean) => void
    availableTags: Tag[]
    selectedTags: Tag[]
    onTagsChange: (tags: Tag[]) => void

    // Preview props
    selectedNode: any | null
    onClosePreview: () => void
    onConnect: () => void
    onOpenInNotebook: () => void
    onCreateAtom?: () => void
}

export function GraphSidebar({
    searchText,
    onSearchChange,
    activeTypeFilter,
    onTypeFilterChange,
    showMyAtomsOnly,
    onShowMyAtomsOnlyChange,
    availableTags,
    selectedTags,
    onTagsChange,
    selectedNode,
    onClosePreview,
    onConnect,
    onOpenInNotebook,
    onCreateAtom
}: GraphSidebarProps) {
    return (
        <>
            {/* Main Sidebar (Filters & Navigation) */}
            <div className="absolute top-4 left-4 z-10 w-80 space-y-4">
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl">
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search atoms..."
                                className="pl-8 bg-black/40 border-white/20 focus:border-primary"
                                value={searchText}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>

                        {/* Type Filters */}
                        <div className="flex flex-wrap gap-2">
                            {['idea', 'question', 'quote', 'insight'].map(type => {
                                const typeColors = {
                                    idea: '#00f0ff',
                                    question: '#ff003c',
                                    quote: '#7000ff',
                                    insight: '#ffe600'
                                }
                                const color = typeColors[type as keyof typeof typeColors]
                                const isActive = activeTypeFilter === type

                                return (
                                    <Button
                                        key={type}
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 text-xs capitalize ${isActive ? '' : 'bg-transparent hover:bg-white/5'}`}
                                        style={{
                                            borderColor: color,
                                            backgroundColor: isActive ? color : undefined,
                                            color: isActive ? '#000' : color
                                        }}
                                        onClick={() => onTypeFilterChange(activeTypeFilter === type ? null : type)}
                                    >
                                        {type}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* My Atoms Toggle */}
                        <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                            <Switch
                                id="my-atoms"
                                checked={showMyAtomsOnly}
                                onCheckedChange={onShowMyAtomsOnlyChange}
                            />
                            <Label htmlFor="my-atoms" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                                <User className="h-3 w-3" />
                                My Atoms Only
                            </Label>
                        </div>

                        {/* Tag Filter */}
                        {availableTags.length > 0 && (
                            <div className="pt-3 border-t border-white/10 mt-3">
                                <TagFilter
                                    availableTags={availableTags}
                                    selectedTags={selectedTags}
                                    onTagsChange={onTagsChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Node Preview (Floating Card) */}
            {selectedNode && (
                <div className="absolute top-4 right-4 z-10 w-80 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg leading-tight text-white">
                                    {selectedNode.name}
                                </h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClosePreview}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {selectedNode.note && (
                                <>
                                    <div className="text-sm text-gray-400 line-clamp-6">
                                        {selectedNode.note.body}
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={onOpenInNotebook}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open in Notebook
                                        </Button>
                                        <Button
                                            className="w-full"
                                            variant="secondary"
                                            onClick={onConnect}
                                        >
                                            <Network className="h-4 w-4 mr-2" />
                                            Connect
                                        </Button>
                                    </div>
                                </>
                            )}
                            {selectedNode.text && (
                                <>
                                    <div className="text-sm text-gray-400">
                                        Text Node
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        onClick={onCreateAtom}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Create Atom
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
