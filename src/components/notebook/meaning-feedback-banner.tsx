'use client'

import { AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface MeaningFeedbackBannerProps {
    status: 'approved' | 'pending' | 'rejected' | null
    result: string | null
    awards?: {
        xp: number
        sp: {
            thinking: number
            reading: number
            writing: number
            engagement: number
        }
    }
    onDismiss?: () => void
}

export function MeaningFeedbackBanner({ status, result, awards, onDismiss }: MeaningFeedbackBannerProps) {
    const [dismissed, setDismissed] = useState(false)

    if (!status || !result || dismissed) return null

    const handleDismiss = () => {
        setDismissed(true)
        onDismiss?.()
    }

    // Determine feedback state based on status and result
    const getState = () => {
        if (status === 'approved') {
            return {
                type: 'success' as const,
                icon: CheckCircle,
                message: 'Insight confirmed.',
                bgColor: 'bg-green-600/10',
                borderColor: 'border-green-600/30',
                textColor: 'text-green-400',
                iconColor: 'text-green-500'
            }
        }

        if (result.toLowerCase().includes('unclear')) {
            return {
                type: 'warning' as const,
                icon: AlertTriangle,
                message: 'Clarify: add one precise detail.',
                bgColor: 'bg-yellow-600/10',
                borderColor: 'border-yellow-600/30',
                textColor: 'text-yellow-400',
                iconColor: 'text-yellow-500'
            }
        }

        if (result.toLowerCase().includes('not meaningful') || status === 'rejected') {
            return {
                type: 'error' as const,
                icon: AlertCircle,
                message: 'Meaning not detected — refine your signal.',
                bgColor: 'bg-red-600/10',
                borderColor: 'border-red-600/30',
                textColor: 'text-red-400',
                iconColor: 'text-red-500'
            }
        }

        // Default pending state
        return {
            type: 'info' as const,
            icon: AlertCircle,
            message: 'Under review...',
            bgColor: 'bg-blue-600/10',
            borderColor: 'border-blue-600/30',
            textColor: 'text-blue-400',
            iconColor: 'text-blue-500'
        }
    }

    const state = getState()
    const Icon = state.icon

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${state.bgColor} ${state.borderColor} mb-4`}>
            <Icon className={`h-5 w-5 ${state.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
                <p className={`text-sm font-medium ${state.textColor}`}>
                    {state.message}
                </p>
                {status === 'approved' && awards && (
                    <div className="mt-1 flex gap-3 text-xs opacity-90">
                        <span className="text-green-400 font-semibold">+{awards.xp} XP</span>
                        {awards.sp.thinking > 0 && <span className="text-blue-400">+{awards.sp.thinking} Thinking SP</span>}
                        {awards.sp.reading > 0 && <span className="text-emerald-400">+{awards.sp.reading} Reading SP</span>}
                        {awards.sp.writing > 0 && <span className="text-amber-400">+{awards.sp.writing} Writing SP</span>}
                        {awards.sp.engagement > 0 && <span className="text-purple-400">+{awards.sp.engagement} Engagement SP</span>}
                    </div>
                )}
            </div>
            {onDismiss && (
                <button
                    onClick={handleDismiss}
                    className={`${state.textColor} hover:opacity-70 transition-opacity`}
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
