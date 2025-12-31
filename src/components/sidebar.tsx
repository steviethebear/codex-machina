'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Network, ShieldAlert, LogOut, PlusCircle, BookOpen, Sparkles, Library, Users, Layers } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { ViewSwitcher } from '@/components/view-switcher'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const studentNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Class Feed', href: '/feed', icon: Sparkles },
    { name: 'My Notes', href: '/my-notes', icon: BookOpen },
    { name: 'Threads', href: '/threads', icon: Layers },
    { name: 'Graph', href: '/graph', icon: Network },
]

const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Sources', href: '/admin/sources', icon: Library },
]

export function Sidebar() {
    const pathname = usePathname()
    const { signOut, user } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    const [counts, setCounts] = useState({ fleeting: 0, permanent: 0 })
    const supabase = createClient()

    useEffect(() => {
        const checkAdmin = async () => {
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single()
                // @ts-ignore
                setIsAdmin(data?.is_admin || false)
            }
        }
        checkAdmin()

        // Fetch note counts
        const fetchCounts = async () => {
            if (user) {
                const [fleeting, permanent] = await Promise.all([
                    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'fleeting'),
                    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'permanent')
                ])

                setCounts({
                    fleeting: fleeting.count || 0,
                    permanent: permanent.count || 0
                })
            }
        }
        fetchCounts()
    }, [user, supabase])

    const isInAdminView = pathname?.startsWith('/admin')
    const navigation = isInAdminView ? adminNavigation : studentNavigation

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center justify-between px-6 border-b">
                <h1 className="text-lg font-bold tracking-tight text-primary">Codex Machina</h1>
                {!isInAdminView && <NotificationBell />}
            </div>

            <ViewSwitcher isAdmin={isAdmin} />

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
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground',
                                        'mr-3 h-5 w-5 flex-shrink-0'
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="flex-1">{item.name}</span>
                                {item.name === 'My Notes' && (counts.fleeting > 0 || counts.permanent > 0) && (
                                    <div className="ml-auto flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium border">
                                        <span className="text-red-500">{counts.fleeting}</span>
                                        <span className="text-muted-foreground">{counts.permanent}</span>
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-8 px-4">
                    <Link href="/my-notes?action=new" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <PlusCircle className="h-4 w-4" />
                        New Note
                    </Link>
                </div>
            </div>

            <div className="border-t p-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Logged in as</span>
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

