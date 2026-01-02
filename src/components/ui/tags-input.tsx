'use client'

import * as React from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TagsInputProps {
    value: string[]
    onChange?: (tags: string[]) => void
    onAddTag?: (tag: string) => void
    onRemoveTag?: (tag: string) => void
    onTagClick?: (tag: string) => void
    suggestions?: string[]
    placeholder?: string
    disabled?: boolean
}

export function TagsInput({ value, onChange, onAddTag, onRemoveTag, onTagClick, suggestions = [], placeholder = "Add tag...", disabled = false }: TagsInputProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const handleUnselect = (tag: string) => {
        if (onRemoveTag) {
            onRemoveTag(tag)
        } else if (onChange) {
            onChange(value.filter((s) => s !== tag))
        }
    }

    const handleSelect = (tag: string) => {
        if (onAddTag) {
            if (!value.includes(tag)) onAddTag(tag)
        } else if (onChange) {
            if (!value.includes(tag)) {
                onChange([...value, tag])
            }
        }
        setInputValue("")
        setOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault()
            const tag = inputValue.trim()
            if (onAddTag) {
                if (!value.includes(tag)) onAddTag(tag)
            } else if (onChange) {
                if (!value.includes(tag)) {
                    onChange([...value, tag])
                }
            }
            setInputValue("")
        }
        // Backspace to delete last if empty
        if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            const lastTag = value[value.length - 1]
            if (onRemoveTag) {
                onRemoveTag(lastTag)
            } else if (onChange) {
                onChange(value.slice(0, -1))
            }
        }
    }

    // Filter available suggestions
    const available = suggestions.filter(s => !value.includes(s))

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {value.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1 font-normal text-xs">
                    <span
                        className={cn("cursor-pointer hover:underline", onTagClick ? "cursor-pointer" : "cursor-default")}
                        onClick={() => onTagClick && onTagClick(tag)}
                    >
                        #{tag}
                    </span>
                    {!disabled && (
                        <button
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted/80"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleUnselect(tag)
                                }
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onClick={() => handleUnselect(tag)}
                            disabled={disabled}
                            title="Remove tag"
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </Badge>
            ))}

            {!disabled && (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            role="combobox"
                            aria-expanded={open}
                            className={cn("h-6 px-2 text-xs text-muted-foreground hover:text-foreground", value.length === 0 && "pl-0")}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            {placeholder}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Search or type new..."
                                value={inputValue}
                                onValueChange={setInputValue}
                                onKeyDown={handleKeyDown}
                            />
                            <CommandList>
                                <CommandGroup>
                                    {available.length > 0 ? (
                                        available.map((tag) => (
                                            <CommandItem
                                                key={tag}
                                                onSelect={() => handleSelect(tag)}
                                                className="text-xs"
                                            >
                                                #{tag}
                                            </CommandItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-muted-foreground text-center">
                                            Type and press Enter to create
                                        </div>
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
