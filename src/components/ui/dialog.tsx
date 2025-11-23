'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                onOpenChange(false)
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [open, onOpenChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/80"
                onClick={() => onOpenChange(false)}
            />

            {/* Content */}
            <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border rounded-lg shadow-lg p-6">
                {children}
            </div>
        </div>
    )
}

interface DialogHeaderProps {
    children: React.ReactNode
    onClose?: () => void
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1 rounded-sm hover:bg-accent"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-2xl font-bold tracking-tight">{children}</h2>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-muted-foreground mt-1">{children}</p>
}
