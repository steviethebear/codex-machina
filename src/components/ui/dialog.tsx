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

// DialogTrigger - renders children and opens dialog on click
interface DialogTriggerProps {
    children: React.ReactNode
    asChild?: boolean
}

export const DialogTrigger = React.forwardRef<
    HTMLButtonElement,
    DialogTriggerProps & React.ComponentPropsWithoutRef<'button'>
>(({ children, asChild, ...props }, ref) => {
    // When using asChild, we just render the child directly.
    // The parent Dialog manages open state, so this is a no-op wrapper.
    // For simplicity, we render a button or the child.
    if (asChild && React.isValidElement(children)) {
        return children
    }
    return (
        <button ref={ref} {...props}>
            {children}
        </button>
    )
})
DialogTrigger.displayName = 'DialogTrigger'

// DialogContent - wrapper for modal content (optional, for API consistency)
interface DialogContentProps {
    children: React.ReactNode
    className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
    return <div className={cn('', className)}>{children}</div>
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

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h2 className={cn("text-2xl font-bold tracking-tight", className)}>{children}</h2>
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("text-sm text-muted-foreground mt-1", className)}>{children}</div>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="flex justify-end gap-2 mt-6">{children}</div>
}

