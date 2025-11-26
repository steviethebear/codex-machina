import { Database } from '@/types/database.types'
import { FileText, Network, BookOpen, Zap, Activity, Star, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Action = Database['public']['Tables']['actions']['Row']

interface ActivityFeedProps {
    actions: Action[]
}

export function ActivityFeed({ actions }: ActivityFeedProps) {
    const getIcon = (type: string) => {
        const lowerType = type.toLowerCase().replace(/\s+/g, '_')
        switch (lowerType) {
            case 'create_atom':
            case 'create_note':
                return <FileText className="h-4 w-4 text-blue-400" />
            case 'create_link':
            case 'link_note':
                return <LinkIcon className="h-4 w-4 text-purple-400" />
            case 'create_reflection':
            case 'reflection':
                return <BookOpen className="h-4 w-4 text-green-400" />
            case 'hub_created':
                return <Zap className="h-4 w-4 text-yellow-400" />
            case 'level_up':
                return <Star className="h-4 w-4 text-amber-400" />
            default:
                return <Activity className="h-4 w-4 text-gray-400" />
        }
    }

    const getLabel = (type: string) => {
        const lowerType = type.toLowerCase().replace(/\s+/g, '_')
        switch (lowerType) {
            case 'create_atom':
            case 'create_note':
                return 'Created an Atom'
            case 'create_link':
            case 'link_note':
                return 'Connected Ideas'
            case 'create_reflection':
            case 'reflection':
                return 'Submitted Reflection'
            case 'hub_created':
                return 'Hub Created'
            case 'level_up':
                return 'Level Up!'
            default:
                return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
    }

    if (actions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No recent activity</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {actions.map((action) => (
                <div key={action.id} className="group">
                    {action.target_id ? (
                        <Link
                            href={`/notes/${action.target_id}`}
                            className="flex gap-3 items-start p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-pointer"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-border group-hover:ring-primary/50 transition-all">
                                {getIcon(action.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {getLabel(action.type)}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {action.description || `Earned rewards`}
                                </p>

                                {/* Points Breakdown */}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {action.xp > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            +{action.xp} XP
                                        </span>
                                    )}
                                    {action.sp_reading > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            +{action.sp_reading} Reading
                                        </span>
                                    )}
                                    {action.sp_thinking > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            +{action.sp_thinking} Thinking
                                        </span>
                                    )}
                                    {action.sp_writing > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
                                            +{action.sp_writing} Writing
                                        </span>
                                    )}
                                    {action.sp_engagement > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                            +{action.sp_engagement} Engagement
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex gap-3 items-start p-3 rounded-lg border border-border bg-card">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-border">
                                {getIcon(action.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-foreground">
                                        {getLabel(action.type)}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {action.description || `Earned rewards`}
                                </p>

                                {/* Points Breakdown */}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {action.xp > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            +{action.xp} XP
                                        </span>
                                    )}
                                    {action.sp_reading > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            +{action.sp_reading} Reading
                                        </span>
                                    )}
                                    {action.sp_thinking > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            +{action.sp_thinking} Thinking
                                        </span>
                                    )}
                                    {action.sp_writing > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
                                            +{action.sp_writing} Writing
                                        </span>
                                    )}
                                    {action.sp_engagement > 0 && (
                                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                            +{action.sp_engagement} Engagement
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
