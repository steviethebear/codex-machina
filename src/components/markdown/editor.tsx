import { useState, useRef } from 'react'
import { MarkdownRenderer } from './renderer'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Bold, Italic, List, Link as LinkIcon, Code, Quote } from 'lucide-react'

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
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const charCount = value.length
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

    const insertFormat = (prefix: string, suffix: string = '') => {
        if (!textareaRef.current) return

        const start = textareaRef.current.selectionStart
        const end = textareaRef.current.selectionEnd
        const text = textareaRef.current.value

        const before = text.substring(0, start)
        const selection = text.substring(start, end)
        const after = text.substring(end)

        const newValue = before + prefix + selection + suffix + after
        onChange(newValue)

        // Restore focus and selection
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(
                    start + prefix.length,
                    end + prefix.length
                )
            }
        }, 0)
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-1 border rounded-t-md bg-muted/40">
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormat('**', '**')}
                        title="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormat('*', '*')}
                        title="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormat('- ')}
                        title="List"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormat('> ')}
                        title="Quote"
                    >
                        <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormat('`', '`')}
                        title="Code"
                    >
                        <Code className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => insertFormat('[', '](url)')}
                        title="Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-8 text-xs"
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
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="flex min-h-[200px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        style={{ resize: 'vertical' }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-1 rounded pointer-events-none">
                        {wordCount} words | {charCount} chars
                        {minLength && (
                            <span className={charCount >= minLength ? 'text-green-500 ml-1' : 'text-destructive ml-1'}>
                                (min: {minLength})
                            </span>
                        )}
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
