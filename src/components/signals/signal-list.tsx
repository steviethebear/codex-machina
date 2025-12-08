'use client'

import { SignalWithStatus } from '@/lib/actions/signals/get-signals'
import { SignalCard } from './signal-card'

interface SignalListProps {
    signals: SignalWithStatus[]
    onSelect: (signal: SignalWithStatus) => void
    onActivate: (signal: SignalWithStatus) => void
    selectedSignalId?: string | null
}

export function SignalList({ signals, onSelect, onActivate, selectedSignalId }: SignalListProps) {
    const inProgress = signals.filter(s => s.user_status === 'in_progress' || s.user_status === 'queued_for_review')
    const available = signals.filter(s => s.user_status === 'available')
    const completed = signals.filter(s => s.user_status === 'completed')

    if (signals.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-sm">
                No signals found. Keep exploring the graph to discover them!
            </div>
        )
    }

    return (
        <div className="space-y-6 p-3">
            {inProgress.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-1">
                        In Progress
                    </h2>
                    <div className="space-y-2">
                        {inProgress.map(signal => (
                            <SignalCard
                                key={signal.id}
                                signal={signal}
                                onSelect={onSelect}
                                onActivate={onActivate}
                                isSelected={selectedSignalId === signal.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {available.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-1">
                        Available
                    </h2>
                    <div className="space-y-2">
                        {available.map(signal => (
                            <SignalCard
                                key={signal.id}
                                signal={signal}
                                onSelect={onSelect}
                                onActivate={onActivate}
                                isSelected={selectedSignalId === signal.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {completed.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-1">
                        Completed
                    </h2>
                    <div className="space-y-2">
                        {completed.map(signal => (
                            <SignalCard
                                key={signal.id}
                                signal={signal}
                                onSelect={onSelect}
                                onActivate={onActivate}
                                isSelected={selectedSignalId === signal.id}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
