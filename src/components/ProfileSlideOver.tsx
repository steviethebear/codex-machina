'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Sparkles, Trophy, ExternalLink } from 'lucide-react'
import { FeedCard } from '@/components/pkm/FeedCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'
import { ScrollArea } from './ui/scroll-area'

type Note = Database['public']['Tables']['notes']['Row'] & {
    user?: { codex_name: string | null, email: string }
}

interface ProfileSlideOverProps {
    userId: string | null
    open: boolean
    onClose: () => void
    onNoteClick?: (note: Note) => void
}

export function ProfileSlideOver({ userId, open, onClose, onNoteClick }: ProfileSlideOverProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<{ codex_name: string | null, email: string } | null>(null)
    const [notes, setNotes] = useState<Note[]>([])

    // Achievements State
    const [achievements, setAchievements] = useState<any[]>([])
    const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!userId || !open) return

        const fetchData = async () => {
            setLoading(true)

            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('users')
                .select('codex_name, email')
                .eq('id', userId)
                .single()
            setProfile(profileData)

            // 2. Fetch Public Notes
            const { data: notesData } = await supabase
                .from('notes')
                .select(`
                    *,
                    user:users(codex_name, email)
                `)
                .eq('user_id', userId)
                //.eq('is_public', true) // Wait, maybe they want to see ALL permanent notes if admin? 
                // Or user meant "public codex" implies public ones. 
                // Let's stick to public for safety but ensure type is permanent.
                .eq('type', 'permanent')
                .match({ is_public: true }) // Explicit match for public
                .order('updated_at', { ascending: false })

            if (notesData) setNotes(notesData as any as Note[])

            // 3. Fetch Achievements
            const { data: allAchievements } = await supabase
                .from('achievements')
                .select('*')
                .order('name', { ascending: true })

            const { data: myAchievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId)

            setAchievements(allAchievements || [])
            setUserAchievements(new Set((myAchievements as any[])?.map((a: any) => a.achievement_id) || []))

            setLoading(false)
        }
        fetchData()
    }, [userId, open, supabase])

    const unlockedList = achievements.filter(a => userAchievements.has(a.id))

    if (!userId) return null

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full overflow-hidden p-0 bg-background border-l shadow-2xl">
                <SheetTitle className="sr-only">User Profile</SheetTitle>

                {loading ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : !profile ? (
                    <div className="p-8 text-muted-foreground">User not found</div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b bg-muted/10 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary shrink-0">
                                {profile.codex_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold tracking-tight truncate">
                                    {profile.codex_name || "Unknown Scholar"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {notes.length} Public Scrolls &bull; {unlockedList.length} Achievements
                                </p>
                            </div>
                            <Link href={`/user/${userId}`} passHref>
                                <Button variant="ghost" size="icon" title="Open Full Profile Page">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">

                                {/* Achievements Section */}
                                {unlockedList.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold flex items-center text-muted-foreground uppercase tracking-wider">
                                            <Trophy className="h-4 w-4 mr-2" />
                                            Achievements
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {unlockedList.map((achievement) => (
                                                <div
                                                    key={achievement.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg border bg-primary/5 border-primary/20"
                                                >
                                                    <div className="text-lg">
                                                        {achievement.icon || '🏆'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-xs text-primary truncate">
                                                            {achievement.name}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                            {achievement.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Public Notes Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center text-muted-foreground uppercase tracking-wider">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Public Codex
                                    </h3>

                                    {notes.length === 0 ? (
                                        <div className="text-muted-foreground italic text-sm">No public notes published yet.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {notes.map(note => (
                                                <FeedCard
                                                    key={note.id}
                                                    note={note}
                                                    onClick={() => onNoteClick && onNoteClick(note)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
