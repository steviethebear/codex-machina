'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { getSignals, SignalWithStatus } from '@/lib/actions/signals/get-signals'
import { activateSignal } from '@/lib/actions/signals/activate-signal'
import { SignalList } from '@/components/signals/signal-list'
import { SignalDetail } from '@/components/signals/signal-detail'
import { EmptyState } from './empty-state'
import { NotebookLayout } from './notebook-layout'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { useOracle } from '@/components/oracle/oracle-context'

export function SignalsTabContent() {
    const { user } = useAuth()
    const { speak } = useOracle()
    const [signals, setSignals] = useState<SignalWithStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSignal, setSelectedSignal] = useState<SignalWithStatus | null>(null)

    const fetchSignals = async () => {
        if (!user) return
        try {
            const data = await getSignals(user.id)
            setSignals(data)
        } catch (error) {
            console.error('Error fetching signals:', error)
            toast.error('Failed to load signals')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSignals()
    }, [user])

    const handleActivate = async (signal: SignalWithStatus) => {
        if (!user) return

        try {
            const result = await activateSignal(user.id, signal.id)
            if (result.success) {
                toast.success(result.message)
                if (result.oracleMessage) {
                    speak(result.oracleMessage, 'announcement')
                }
                // Refresh list
                fetchSignals()
                // Update selected signal if it's the one we just activated
                if (selectedSignal?.id === signal.id) {
                    setSelectedSignal({ ...signal, user_status: 'in_progress' })
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error('Error activating signal:', error)
            toast.error('Failed to activate signal')
        }
    }

    if (loading) {
        return (
            <NotebookLayout sidebar={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </NotebookLayout>
        )
    }

    const sidebar = (
        <>
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Oracle Signals
                </h3>
            </div>

            {/* Signals List */}
            <div className="flex-1 overflow-y-auto">
                {signals.length > 0 ? (
                    <SignalList
                        signals={signals}
                        onSelect={setSelectedSignal}
                        onActivate={handleActivate}
                        selectedSignalId={selectedSignal?.id}
                    />
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        <div className="mb-2">🔮</div>
                        No signals discovered yet
                    </div>
                )}
            </div>
        </>
    )

    return (
        <NotebookLayout sidebar={sidebar}>
            {selectedSignal ? (
                <SignalDetail
                    signal={selectedSignal}
                    onClose={() => setSelectedSignal(null)}
                    onActivate={handleActivate}
                    onUpdate={fetchSignals}
                />
            ) : (
                <EmptyState
                    icon="🔮"
                    title="Select a signal"
                    description="Choose a signal from the sidebar to view details and activate it."
                />
            )}
        </NotebookLayout>
    )
}
