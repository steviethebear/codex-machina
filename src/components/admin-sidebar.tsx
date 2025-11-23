'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Book, Calendar, ShieldAlert, Users, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { ViewSwitcher } from '@/components/view-switcher'
import { createClient } from '@/lib/supabase/client'

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Texts', href: '/admin/texts', icon: Book },
    { name: 'Units', href: '/admin/units', icon: Calendar },
    { name: 'Reflections', href: '/admin/reflections', icon: Book },
    { name: 'Moderation', href: '/admin/moderation', icon: ShieldAlert },
    { name: 'Students', href: '/admin/students', icon: Users },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { signOut, user } = useAuth()

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center px-6 border-b bg-destructive/10">
                <h1 className="text-lg font-bold tracking-tight text-destructive">Admin Control</h1>
            </div>

            <ViewSwitcher isAdmin={true} />

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-destructive' : 'text-muted-foreground group-hover:text-accent-foreground',
                                        'mr-3 h-5 w-5 flex-shrink-0'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Admin</span>
                        <span className="text-sm font-medium truncate max-w-[120px]">{user?.email}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
                        <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
