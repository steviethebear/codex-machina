'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NotebookLayoutProps {
    sidebar: ReactNode
    children: ReactNode
    className?: string
}

export function NotebookLayout({ sidebar, children, className }: NotebookLayoutProps) {
    return (
        <div className={cn('flex-1 flex gap-0', className)}>
            {/* Left Sidebar */}
            <div className="w-72 border-r border-gray-800 bg-[#252525] flex flex-col">
                {sidebar}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
