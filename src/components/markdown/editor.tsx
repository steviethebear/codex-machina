'use client'

import { useState } from 'react'
import { MarkdownRenderer } from './renderer'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    minLength?: number
    className?: string
    showPreview?: boolean
}

export function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Write your content using markdown...',
    minLength,
    className = '',
    showPreview: defaultShowPreview = false
}: MarkdownEditorProps) {
    const [showPreview, setShowPreview] = useState(defaultShowPreview)
    const charCount = value.length

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>{charCount} characters</span>
                    {minLength && (
                        <span className={charCount >= minLength ? 'text-green-500' : 'text-destructive'}>
                            (min: {minLength})
                        </span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-7"
                >
                    {showPreview ? (
                        <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide Preview
                        </>
                    ) : (
                        <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show Preview
                        </>
                    )}
                </Button>
            </div>

            {/* Editor + Preview */}
            <div className={`grid gap-4 ${showPreview ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Textarea */}
                <div>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        style={{ resize: 'vertical' }}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                        Supports: **bold**, *italic*, # headings, - lists, [links](url), `code`, &gt; quotes
                    </div>
                </div>

                {/* Preview */}
                {showPreview && (
                    <div className="border rounded-md p-3 bg-muted/20 min-h-[200px] overflow-auto">
                        {value.trim() ? (
                            <MarkdownRenderer content={value} />
                        ) : (
                            <div className="text-sm text-muted-foreground italic">
                                Preview will appear here...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
