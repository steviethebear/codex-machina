'use client'

import { SignalWithStatus } from '@/lib/actions/signals/get-signals'
import { cn } from '@/lib/utils'
import { Lock, Play, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SignalCardProps {
    signal: SignalWithStatus
    onSelect: (signal: SignalWithStatus) => void
    onActivate: (signal: SignalWithStatus) => void
    isSelected?: boolean
}

export function SignalCard({ signal, onSelect, onActivate, isSelected }: SignalCardProps) {
    const status = signal.user_status
    const isLocked = status === 'locked'
    const isAvailable = status === 'available'
    const isInProgress = status === 'in_progress'
    const isCompleted = status === 'completed'

    return (
        <div
            className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer",
                isLocked ? "bg-muted/20 border-muted" : "bg-card border-border",
                isInProgress && "border-primary/50 bg-primary/5",
                isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
            )}
            onClick={() => !isLocked && onSelect(signal)}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                    {isInProgress && <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    <h3 className={cn(
                        "font-medium text-sm truncate",
                        isLocked && "text-muted-foreground",
                        isSelected && "text-primary font-semibold"
                    )}>
                        {signal.title}
                    </h3>
                </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {signal.description}
            </p>

            <div className="flex justify-between items-center">
                <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{signal.xp_reward} XP</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-muted">
                        {signal.difficulty}
                    </span>
                </div>

                {isAvailable && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={(e) => {
                            e.stopPropagation()
                            onActivate(signal)
                        }}
                    >
                        <Play className="w-3 h-3 mr-1" />
                        Activate
                    </Button>
                )}
            </div>
        </div>
    )
}
