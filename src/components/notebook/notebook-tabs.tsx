'use client'

import { cn } from '@/lib/utils'

export type NotebookTab = 'atoms' | 'questions' | 'signals' | 'texts'

interface NotebookTabsProps {
    activeTab: NotebookTab
    onTabChange: (tab: NotebookTab) => void
}

const tabs: { id: NotebookTab; label: string }[] = [
    { id: 'atoms', label: 'Atoms' },
    { id: 'questions', label: 'Questions' },
    { id: 'signals', label: 'Signals' },
    { id: 'texts', label: 'Texts' },
]

export function NotebookTabs({ activeTab, onTabChange }: NotebookTabsProps) {
    return (
        <div className="relative bg-muted/30 pt-2 px-2">
            <div className="flex items-end gap-0.5">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                'relative px-5 py-2.5 text-sm font-medium transition-all duration-200',
                                'rounded-t-lg',
                                // Chrome-style separator on right side (except last tab)
                                index < tabs.length - 1 && !isActive && 'after:absolute after:right-0 after:top-3 after:bottom-3 after:w-px after:bg-border/50',
                                isActive
                                    ? [
                                        // Active tab - blends with content area
                                        'bg-background text-foreground',
                                        'shadow-[0_-2px_8px_rgba(0,0,0,0.08)]',
                                        'z-10'
                                    ]
                                    : [
                                        // Inactive tabs - recede into background
                                        'bg-muted/50 text-muted-foreground',
                                        'hover:bg-muted/80 hover:text-foreground',
                                        'border-b border-border',
                                    ]
                            )}
                        >
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
            {/* Bottom border under all tabs */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
        </div>
    )
}
