import { Star, Bookmark, Flag } from 'lucide-react'

type QualityLevel = 'exemplary' | 'interesting' | 'needs_revision'

interface QualityBadgeProps {
    quality: QualityLevel
    isAdmin?: boolean
}

export function QualityBadge({ quality, isAdmin = false }: QualityBadgeProps) {
    const badges = {
        exemplary: {
            icon: Star,
            label: 'Exemplary Work',
            className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
        },
        interesting: {
            icon: Bookmark,
            label: 'Interesting',
            className: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
        },
        needs_revision: {
            icon: Flag,
            label: 'Needs Revision',
            className: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400'
        }
    }

    const badge = badges[quality]
    const Icon = badge.icon

    // Don't show "needs revision" to students
    if (quality === 'needs_revision' && !isAdmin) {
        return null
    }

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${badge.className}`}>
            <Icon className="h-3.5 w-3.5" />
            <span>{badge.label}</span>
        </div>
    )
}
