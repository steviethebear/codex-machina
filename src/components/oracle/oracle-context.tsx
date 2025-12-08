'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { toast } from 'sonner'

interface OracleMessage {
    id: string
    text: string
    timestamp: Date
    type: 'hint' | 'feedback' | 'announcement'
}

interface OracleContextType {
    messages: OracleMessage[]
    speak: (text: string, type?: 'hint' | 'feedback' | 'announcement') => void
    clear: () => void
}

const OracleContext = createContext<OracleContextType | undefined>(undefined)

export function OracleProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<OracleMessage[]>([])

    const speak = (text: string, type: 'hint' | 'feedback' | 'announcement' = 'announcement') => {
        const newMessage: OracleMessage = {
            id: Math.random().toString(36).substring(7),
            text,
            timestamp: new Date(),
            type
        }
        setMessages(prev => [newMessage, ...prev])

        // Also show toast for immediate visibility
        toast(text, {
            icon: '🔮',
            duration: 5000,
            className: 'border-purple-500/50 bg-purple-950/10'
        })
    }

    const clear = () => setMessages([])

    return (
        <OracleContext.Provider value={{ messages, speak, clear }}>
            {children}
        </OracleContext.Provider>
    )
}

export function useOracle() {
    const context = useContext(OracleContext)
    if (context === undefined) {
        throw new Error('useOracle must be used within an OracleProvider')
    }
    return context
}
