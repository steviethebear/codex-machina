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

    // Unlock Check
    const [limit, setLimit] = useState(3)

    useEffect(() => {
        const checkUnlock = async () => {
            // We need to import createClient safely or just assume standard
            // Since this is a component used everywhere, we should be careful about perf.
            // But checking session storage for specific unlock flag is faster?
            // Or just verify once per session. 
            // Let's use the DB.
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase.from('unlocks')
                .select('feature')
                .eq('user_id', user.id)
                .eq('feature', 'deep_breadcrumbs')
                .single()

            if (data) setLimit(10)
        }
        checkUnlock()
    }, [])

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
            label = 'Note'
        }

        if (!label) return

        // Check if we already have this as the LAST item (prevent duplicates on re-render)
        setHistory(prev => {
            const last = prev[prev.length - 1]
            if (last && last.href === href) return prev

            const newItem = { label, href }
            const newHistory = [...prev, newItem].slice(-limit) // Dynamic limit

            // Persist to session storage so it survives refresh
            sessionStorage.setItem('codex-breadcrumbs', JSON.stringify(newHistory))
            return newHistory
        })

    }, [pathname, searchParams, limit])

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
