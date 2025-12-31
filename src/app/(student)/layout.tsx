'use client'

import { Sidebar } from '@/components/sidebar'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-y-auto p-0">
                <div className="border-b px-6 py-2">
                    <Breadcrumbs />
                </div>
                {children}
            </main>
        </div>
    )
}
