'use client'

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database.types'
import { GitBranch, Link, Edit3 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown/renderer'

type Note = Database['public']['Tables']['atomic_notes']['Row']

interface NodeMenuProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    note: Note | null
    onConnect: () => void
    onBranch: () => void
    onExpand: () => void
}

export function NodeMenu({ open, onOpenChange, note, onConnect, onBranch, onExpand }: NodeMenuProps) {
    if (!note) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader onClose={() => onOpenChange(false)}>
                <DialogTitle>
                    <MarkdownRenderer content={note.title} className="prose-p:inline prose-p:m-0" />
                </DialogTitle>
                <DialogDescription>
                    What would you like to do with this idea?
                </DialogDescription>
            </DialogHeader>

            <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm max-h-[200px] overflow-y-auto">
                <MarkdownRenderer content={note.body} />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => {
                        onOpenChange(false)
                        onConnect()
                    }}
                >
                    <Link className="h-6 w-6" />
                    <div className="text-center">
                        <div className="font-semibold">Connect</div>
                        <div className="text-xs text-muted-foreground">Link to an existing atom or text</div>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => {
                        onOpenChange(false)
                        onBranch()
                    }}
                >
                    <GitBranch className="h-6 w-6" />
                    <div className="text-center">
                        <div className="font-semibold">Branch</div>
                        <div className="text-xs text-muted-foreground">Create a new atom linked to this one</div>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => {
                        onOpenChange(false)
                        onExpand()
                    }}
                >
                    <Edit3 className="h-6 w-6" />
                    <div className="text-center">
                        <div className="font-semibold">Expand</div>
                        <div className="text-xs text-muted-foreground">Add more ideas to this atom</div>
                    </div>
                </Button>
            </div>
        </Dialog>
    )
}
