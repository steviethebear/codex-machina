'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { getSignals, SignalWithStatus } from '@/lib/actions/signals/get-signals'
import { discoverSignal } from '@/lib/actions/signals/discover-signal'
import { toast } from 'sonner'

export function useSignalDiscovery() {
    const { user } = useAuth()
    const [potentialSignals, setPotentialSignals] = useState<SignalWithStatus[]>([])

    // Fetch signals that can be discovered via graph exploration
    useEffect(() => {
        const fetchSignals = async () => {
            if (!user) return
            try {
                const allSignals = await getSignals(user.id)
                // Filter for locked signals that are discoverable via graph
                const discoverable = allSignals.filter(
                    s => s.user_status === 'locked' && s.discovery_type === 'graph_exploration'
                )
                setPotentialSignals(discoverable)
            } catch (error) {
                console.error('Error fetching discoverable signals:', error)
            }
        }

        fetchSignals()
    }, [user])

    const checkDiscovery = async (nodeId: string, nodeType: string) => {
        if (!user || potentialSignals.length === 0) return

        for (const signal of potentialSignals) {
            const criteria = signal.discovery_criteria as any
            if (!criteria) continue

            let matched = false

            // Check for specific node ID match
            if (criteria.type === 'node_click' && criteria.targetId === nodeId) {
                matched = true
            }

            // Check for node type match (e.g. "Click any Question node")
            if (criteria.type === 'node_click' && criteria.targetType === nodeType) {
                matched = true
            }

            // Check for random chance on any node click (e.g. "1% chance on any click")
            if (criteria.type === 'random_click' && Math.random() < (criteria.chance || 0.01)) {
                matched = true
            }

            if (matched) {
                // Attempt discovery
                const result = await discoverSignal(user.id, signal.id)

                if (result.success) {
                    // Show Oracle notification
                    toast(result.oracleMessage || "🔮 You've discovered a new Signal!", {
                        description: signal.title,
                        icon: '🔮',
                        duration: 5000,
                        action: {
                            label: 'View',
                            onClick: () => {
                                // Navigate to signals tab
                                sessionStorage.setItem('notebook_active_tab', 'signals')
                                window.location.href = '/notebook'
                            }
                        }
                    })

                    // Remove from potential list so we don't discover it again immediately
                    setPotentialSignals(prev => prev.filter(s => s.id !== signal.id))
                }
            }
        }
    }

    return { checkDiscovery }
}
