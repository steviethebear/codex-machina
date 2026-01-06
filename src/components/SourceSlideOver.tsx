'use client'

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge'
import { ExternalLink, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SourceSlideOverProps {
    open: boolean
    source: any
    onClose: () => void
}

export function SourceSlideOver({ open, source, onClose }: SourceSlideOverProps) {
    if (!source) return null

    return (
        <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-none p-0 bg-background border-l shadow-2xl">
                {/* Accessibility: Hidden Title */}
                <SheetTitle className="sr-only">Source Details</SheetTitle>

                <div className="flex-1 h-full overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <div className="px-6 py-6 border-b flex items-start justify-between bg-card text-card-foreground">
                        <div className="space-y-1 pr-8">
                            <Badge variant="outline" className="capitalize mb-2">
                                {source.type}
                            </Badge>
                            <h2 className="text-xl font-bold leading-tight">
                                {source.title}
                            </h2>
                            <p className="text-muted-foreground font-medium">
                                {source.author}
                            </p>
                        </div>
                        {/* Close button is handled by Sheet default but we can add one if preferred or rely on the X */}
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* Description */}
                            {source.description && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase opacity-70 tracking-wider">
                                        Description
                                    </h3>
                                    <div className="text-base leading-relaxed bg-muted/30 p-4 rounded-lg border">
                                        {source.description}
                                    </div>
                                </div>
                            )}

                            {/* URL */}
                            {source.url && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase opacity-70 tracking-wider">
                                        Source Link
                                    </h3>
                                    <div className="flex items-center gap-2 p-3 bg-blue-50/5 rounded-lg border border-blue-100/10">
                                        <ExternalLink className="h-4 w-4 text-blue-400 shrink-0" />
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline truncate flex-1 text-sm break-all"
                                        >
                                            {source.url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Meta Info */}
                            <div className="pt-6 border-t mt-8 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <div>
                                    <span className="block opacity-70">Format</span>
                                    <span className="capitalize">{source.type}</span>
                                </div>
                                {source.created_at && (
                                    <div>
                                        <span className="block opacity-70">Added</span>
                                        <span>{new Date(source.created_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    )
}
