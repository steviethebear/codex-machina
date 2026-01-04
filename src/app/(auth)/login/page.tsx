'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button' // We need to create this
import { Input } from '@/components/ui/input'   // We need to create this
import { Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const [codexName, setCodexName] = useState('')
    const [teacher, setTeacher] = useState('')
    const [section, setSection] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)

    const handleSignUp = async () => {
        setLoading(true)
        setError(null)

        if (!email.endsWith('@webb.org')) {
            setError('Sign up is restricted to @webb.org email addresses.')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    codex_name: codexName,
                    teacher: teacher,
                    section: section
                }
            },
        })

        if (error) {
            setError(error.message)
        } else {
            setError('Check your email for the confirmation link! (Sender: Supabase / Check Junk Folder)')
        }
        setLoading(false)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error("Supabase Login Error:", error)
            setError(error.message)
            setLoading(false)
        } else if (authData.user) {
            console.log("Login successful, fetching user profile...")
            const { data: userData, error: profileError } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', authData.user.id)
                .single()

            if (profileError) {
                console.error("Profile Fetch Error:", profileError)
            }

            // @ts-ignore
            router.push(userData?.is_admin ? '/admin' : '/dashboard')
            router.refresh()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isSignUp) {
            handleSignUp()
        } else {
            handleLogin(e)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                        Codex Machina
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter the academic simulation
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        {isSignUp && (
                            <>
                                <div>
                                    <label htmlFor="codex-name" className="sr-only">
                                        Codex Name
                                    </label>
                                    <Input
                                        id="codex-name"
                                        name="codex-name"
                                        type="text"
                                        required={isSignUp}
                                        className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                        placeholder="Your Name (e.g. Scribe John)"
                                        value={codexName}
                                        onChange={(e) => setCodexName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={teacher}
                                        onChange={(e) => {
                                            setTeacher(e.target.value)
                                            setSection('') // Reset section when teacher changes
                                        }}
                                        required={isSignUp}
                                        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:border-primary focus:ring-primary"
                                    >
                                        <option value="" disabled>Select Teacher</option>
                                        <option value="Harmer">Harmer</option>
                                        <option value="Hebert">Hebert</option>
                                    </select>

                                    <select
                                        value={section}
                                        onChange={(e) => setSection(e.target.value)}
                                        required={isSignUp}
                                        disabled={!teacher}
                                        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:border-primary focus:ring-primary disabled:opacity-50"
                                    >
                                        <option value="" disabled>Select Section</option>
                                        {teacher === 'Hebert' && <option value="A Block">A Block</option>}
                                        {teacher === 'Harmer' && (
                                            <>
                                                <option value="F Block">F Block</option>
                                                <option value="G Block">G Block</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? 'Sign up' : 'Sign in'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
