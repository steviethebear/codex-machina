'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { ContentQualityResult } from '@/lib/actions/check-content-quality'

interface QualityFeedbackCardProps {
    analysis: ContentQualityResult
}

export function QualityFeedbackCard({ analysis }: QualityFeedbackCardProps) {
    const { quality, feedback, suggestions } = analysis

    // Don't render anything if it's excellent quality
    if (quality === 'excellent') return null

    return (
        <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <Lightbulb className="h-4 w-4" />
                    Let's make this stronger!
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                        Quality: {quality === 'good' ? 'Good' : 'Needs Work'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                    {feedback}
                </p>

                {suggestions.length > 0 && (
                    <div className="space-y-1">
                        <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Suggestions</div>
                        <ul className="space-y-1">
                            {suggestions.map((suggestion, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-orange-400 flex-shrink-0" />
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
