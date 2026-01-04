'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-destructive/10 p-3">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                </div>
                <CardTitle>Authentication Error</CardTitle>
                <CardDescription>
                    {error ? (
                        <span className="font-mono text-xs block mt-2 bg-muted p-2 rounded text-foreground break-all">
                            {error}
                        </span>
                    ) : (
                        "We couldn't verify your login link. It may have expired or been used already."
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button asChild className="w-full">
                    <Link href="/login">Return to Login</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function AuthCodeError() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    )
}
