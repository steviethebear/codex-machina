/**
 * Custom hook for managing notebook tab state
 * Handles tab switching, session persistence, and scroll position
 */

import { useState, useEffect } from 'react'

export type NotebookTab = 'atoms' | 'questions' | 'signals' | 'texts'

const TAB_STORAGE_KEY = 'notebook_active_tab'
const SCROLL_STORAGE_PREFIX = 'notebook_scroll_'

export function useNotebookTab() {
    // Initialize from sessionStorage or default to 'atoms'
    const [activeTab, setActiveTab] = useState<NotebookTab>(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem(TAB_STORAGE_KEY)
            if (stored && ['atoms', 'questions', 'signals', 'texts'].includes(stored)) {
                return stored as NotebookTab
            }
        }
        return 'atoms'
    })

    // Save active tab to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(TAB_STORAGE_KEY, activeTab)
    }, [activeTab])

    // Save scroll position when tab changes
    const saveScrollPosition = (tab: NotebookTab, scrollY: number) => {
        sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}${tab}`, scrollY.toString())
    }

    // Restore scroll position for a tab
    const restoreScrollPosition = (tab: NotebookTab): number => {
        const stored = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${tab}`)
        return stored ? parseInt(stored, 10) : 0
    }

    return {
        activeTab,
        setActiveTab,
        saveScrollPosition,
        restoreScrollPosition,
    }
}
