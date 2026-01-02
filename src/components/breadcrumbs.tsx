'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Breadcrumbs() {
    const pathname = usePathname()

    if (!pathname || pathname === '/dashboard') return null

    const segments = pathname.split('/').filter(Boolean)

    // Map segments to readable labels
    const getLabel = (segment: string, index: number, allSegments: string[]) => {
        // Handle root sections
        if (index === 0) {
            switch (segment) {
                case 'admin': return 'Command Center'
                case 'dashboard': return 'Thinking Profile'
                case 'my-notes': return 'My Codex'
                case 'we-notes': return 'Class Feed'
                case 'threads': return 'Threads'
                case 'graph': return 'Knowledge Graph'
                case 'reflections': return 'Reflections'
                default: return segment.charAt(0).toUpperCase() + segment.slice(1)
            }
        }
        // Handle dynamic routes (simple fallback)
        if (index === 1 && allSegments[0] === 'threads') return 'Thread Detail'
        if (index === 1 && allSegments[0] === 'note') return 'Note Detail'
        if (index === 1 && allSegments[0] === 'admin' && segment === 'student') return 'Student Profile'

        return segment.charAt(0).toUpperCase() + segment.slice(1)
    }

    const breadcrumbs = segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`
        return {
            label: getLabel(segment, index, segments),
            href
        }
    })

    return (
        <nav className="flex items-center text-sm text-muted-foreground p-2 overflow-x-auto whitespace-nowrap">
            <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center">
                <Home className="h-4 w-4" />
            </Link>

            {breadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                    <Link
                        href={item.href}
                        className={cn(
                            "hover:text-foreground transition-colors",
                            index === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""
                        )}
                    >
                        {item.label}
                    </Link>
                </div>
            ))}
        </nav>
    )
}
