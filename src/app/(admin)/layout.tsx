'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const supabase = createClient()
    const [isAdmin, setIsAdmin] = useState(false)
    const [checkingAdmin, setCheckingAdmin] = useState(true)

    useEffect(() => {
        if (isLoading) return
        if (!user) {
            router.push('/login')
            return
        }

        const checkAdmin = async () => {
            const { data } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            // @ts-ignore
            if (data?.is_admin) {
                setIsAdmin(true)
            } else {
                router.push('/dashboard')
            }
            setCheckingAdmin(false)
        }

        checkAdmin()
    }, [user, isLoading, router, supabase])

    if (isLoading || checkingAdmin) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-destructive border-t-transparent" />
            </div>
        )
    }

    if (!isAdmin) return null

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
