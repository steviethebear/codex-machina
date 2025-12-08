'use client'

import { SignalWithStatus } from '@/lib/actions/signals/get-signals'
import { Button } from '@/components/ui/button'
import { X, Play, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SignalDetailProps {
    signal: SignalWithStatus
    onClose: () => void
    onActivate: (signal: SignalWithStatus) => void
}

import { useAuth } from '@/components/auth-provider'
import { submitSignal } from '@/lib/actions/signals/submit-signal'
import { toast } from 'sonner'
import { useState } from 'react'

interface SignalDetailProps {
    signal: SignalWithStatus
    onClose: () => void
    onActivate: (signal: SignalWithStatus) => void
    onUpdate: () => void
}

import { useOracle } from '@/components/oracle/oracle-context'

export function SignalDetail({ signal, onClose, onActivate, onUpdate }: SignalDetailProps) {
    const { user } = useAuth()
    const { speak } = useOracle()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isAvailable = signal.user_status === 'available'
    const isInProgress = signal.user_status === 'in_progress'

    const handleSubmit = async () => {
        if (!user) return
        setIsSubmitting(true)
        try {
            const result = await submitSignal(user.id, signal.id, {})
            if (result.success) {
                toast.success(result.message)
                if (result.oracleMessage) {
                    speak(result.oracleMessage, 'announcement')
                }
                onUpdate()
                onClose()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error('Error submitting signal:', error)
            toast.error('Failed to submit signal')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-full flex flex-col bg-background border-l border-border">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{signal.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground">
                            {signal.estimated_time_minutes} min
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold">{signal.title}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground mb-6">{signal.description}</p>

                    <h3 className="text-lg font-semibold mb-2">Deliverables</h3>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground mb-6">
                        {Array.isArray(signal.deliverables) && signal.deliverables.map((item: any, i: number) => (
                            <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                        ))}
                    </ul>

                    <h3 className="text-lg font-semibold mb-2">Rewards</h3>
                    <div className="flex gap-4 mb-6">
                        <div className="bg-muted/50 p-3 rounded-md text-center min-w-[80px]">
                            <div className="text-xl font-bold text-primary">{signal.xp_reward}</div>
                            <div className="text-xs text-muted-foreground">XP</div>
                        </div>
                        {(signal.sp_thinking || 0) > 0 && (
                            <div className="bg-muted/50 p-3 rounded-md text-center min-w-[80px]">
                                <div className="text-xl font-bold text-blue-500">{signal.sp_thinking}</div>
                                <div className="text-xs text-muted-foreground">Thinking</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border">
                {isAvailable && (
                    <Button className="w-full" onClick={() => onActivate(signal)}>
                        <Play className="w-4 h-4 mr-2" />
                        Activate Signal
                    </Button>
                )}
                {isInProgress && (
                    <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <h4 className="text-sm font-semibold mb-2">Submit Deliverable</h4>
                            <p className="text-xs text-muted-foreground mb-4">
                                Verify your work to complete this signal.
                            </p>
                            <Button
                                className="w-full"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Verifying...' : 'Mark as Complete'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
