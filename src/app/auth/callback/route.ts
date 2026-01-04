import { createClient } from '@/lib/supabase/client' // Correction: use SSR client usually, but for route handler we need cookies
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Create user profile if it doesn't exist
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // We rely on the DB trigger for profile creation now.
                // But just in case, we can verify or log.
                console.log(`User authenticated: ${user.id}`)
            }

            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error("Auth Exchange Error:", error)
            const cookieNames = (await cookies()).getAll().map(c => c.name).join(', ')
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}&cookies=${encodeURIComponent(cookieNames)}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=NoCodeProvided`)
}
