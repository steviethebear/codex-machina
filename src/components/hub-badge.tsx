import { Star } from 'lucide-react'

interface HubBadgeProps {
    connectionCount: number
}

export function HubBadge({ connectionCount }: HubBadgeProps) {
    const isHub = connectionCount >= 5

    if (!isHub) return null

    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
            <Star className="h-3 w-3 fill-yellow-500" />
            <span>Hub</span>
            <span className="text-yellow-600/60 dark:text-yellow-400/60">({connectionCount} connections)</span>
        </div>
    )
}
