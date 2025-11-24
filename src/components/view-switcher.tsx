'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/simple-tooltip'

interface ViewSwitcherProps {
    isAdmin: boolean
}

export function ViewSwitcher({ isAdmin }: ViewSwitcherProps) {
    const pathname = usePathname()
    const isInAdminView = pathname.startsWith('/admin')

    if (!isAdmin) return null

    return (
        <div className="p-4 border-b">
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <SimpleTooltip content="Switch to student view">
                    <Link
                        href="/dashboard"
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${!isInAdminView
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        <span>Student</span>
                    </Link>
                </SimpleTooltip>
                <SimpleTooltip content="Switch to admin view">
                    <Link
                        href="/admin"
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${isInAdminView
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>Admin</span>
                    </Link>
                </SimpleTooltip>
            </div>
        </div>
    )
}
