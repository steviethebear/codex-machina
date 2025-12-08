'use client'

import { useState } from 'react'
import { useOracle } from './oracle-context'
import { Button } from '@/components/ui/button'
import { X, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function OracleInterface() {
    const { messages } = useOracle()
    const [isOpen, setIsOpen] = useState(false)

    if (messages.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen ? (
                <div className="w-80 h-96 bg-background/95 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="p-3 border-b border-purple-500/20 flex justify-between items-center bg-purple-500/5 rounded-t-lg">
                        <div className="flex items-center gap-2 font-semibold text-purple-400">
                            <span>🔮</span>
                            <span>Oracle Log</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3 text-sm">
                                    <p className="text-foreground/90 mb-1">{msg.text}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full h-12 w-12 bg-purple-600 hover:bg-purple-700 shadow-lg border-2 border-purple-400/50"
                >
                    <span className="text-xl">🔮</span>
                    {messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center border-2 border-background">
                            {messages.length}
                        </span>
                    )}
                </Button>
            )}
        </div>
    )
}
