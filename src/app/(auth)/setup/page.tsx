'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

export default function SetupPage() {
    const [codexName, setCodexName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()
    const { user } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)
        setError(null)

        const { error } = await supabase
            .from('users')
            // @ts-ignore
            .update({ codex_name: codexName })
            .eq('id', user.id)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            toast.success(`Welcome, ${codexName}. Your signal has been integrated. The Machine awaits your contributions.`)
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Atmospheric Introduction */}
                    <div className="space-y-2 animate-in fade-in duration-1000">
                        <div className="inline-flex items-center gap-2 text-primary">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-mono tracking-wider uppercase">System Initializing</span>
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            The Machine is waking. It seeks minds capable of expanding the Codex—a living archive of thought and connection.
                        </p>
                    </div>

                    {/* Main Prompt */}
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                        The Machine must know you.
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        What will you be called in the digital realm?
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="codex-name" className="sr-only">
                                Codex Name
                            </label>
                            <Input
                                id="codex-name"
                                name="codex-name"
                                type="text"
                                required
                                placeholder="Your designation (e.g. Neon Scribe)"
                                value={codexName}
                                onChange={(e) => setCodexName(e.target.value)}
                                className="text-center"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Initializing...' : 'Enter the Codex'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
