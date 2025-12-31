'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
    label: string
    href: string
}

export function Breadcrumbs() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [history, setHistory] = useState<BreadcrumbItem[]>([])

    // Effect to update breadcrumbs based on navigation
    // Note: In a real app, we might need more complex logic to detect "back" vs "new path".
    // For now, we'll keep a simple "stack" of the last 5 relevant locations.
    useEffect(() => {
        // Define relevant paths we want to track
        // We only care about main views and reading nodes
        if (!pathname) return

        let label = ''
        let href = pathname

        if (pathname === '/dashboard') label = 'Thinking Profile'
        else if (pathname === '/my-notes') label = 'My Codex'
        else if (pathname === '/graph') label = 'Graph'
        else if (pathname === '/feed') label = 'Class Feed'
        else if (pathname.startsWith('/note/')) {
            // We can't easily get the note title here without client-side fetching or passing it down.
            // For MVP, we'll just say "Note".
            // Ideally, the Note page itself would update the context.
            label = 'Note'
        }

        if (!label) return

        // Check if we already have this as the LAST item (prevent duplicates on re-render)
        setHistory(prev => {
            const last = prev[prev.length - 1]
            if (last && last.href === href) return prev

            // If we are navigating "back" (e.g. clicking a breadcrumb), we should truncate?
            // For now, let's just keep a rolling list of where we've been. "Paths of thought".
            const newItem = { label, href }
            const newHistory = [...prev, newItem].slice(-5) // Keep last 5

            // Persist to session storage so it survives refresh
            sessionStorage.setItem('codex-breadcrumbs', JSON.stringify(newHistory))
            return newHistory
        })

    }, [pathname, searchParams])

    // Load from session on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('codex-breadcrumbs')
        if (saved) {
            try {
                setHistory(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse breadcrumbs", e)
            }
        }
    }, [])

    if (history.length === 0) return null

    return (
        <nav className="flex items-center text-sm text-muted-foreground p-2 overflow-x-auto whitespace-nowrap">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
            </Link>

            {history.map((item, index) => (
                <div key={`${item.href}-${index}`} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                    <Link
                        href={item.href}
                        className={cn(
                            "hover:text-foreground transition-colors",
                            index === history.length - 1 ? "font-medium text-foreground" : ""
                        )}
                    >
                        {item.label}
                    </Link>
                </div>
            ))}
        </nav>
    )
}
