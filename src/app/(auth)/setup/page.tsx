'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth-provider'

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
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                        Choose Your Codex Name
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This is how you will be known in the simulation.
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
                                placeholder="Codex Name (e.g. Neon Scribe)"
                                value={codexName}
                                onChange={(e) => setCodexName(e.target.value)}
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
                        {loading ? 'Initializing...' : 'Enter Simulation'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
