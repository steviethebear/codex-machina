import { X } from 'lucide-react'
import { Database } from '@/types/database.types'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagBadgeProps {
    tag: Tag
    onRemove?: () => void
    onClick?: () => void
    variant?: 'default' | 'interactive'
}

export function TagBadge({ tag, onRemove, onClick, variant = 'default' }: TagBadgeProps) {
    const isInteractive = variant === 'interactive' || onClick

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${isInteractive
                    ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer'
                    : 'bg-secondary text-secondary-foreground border-border'
                }`}
            onClick={onClick}
        >
            <span>{tag.display_name}</span>
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="hover:text-destructive transition-colors"
                    aria-label={`Remove tag ${tag.display_name}`}
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </span>
    )
}
