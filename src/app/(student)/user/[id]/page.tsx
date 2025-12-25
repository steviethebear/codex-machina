'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, FileText, Sparkles, Trophy } from 'lucide-react'
import { FeedCard } from '@/components/pkm/FeedCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Database } from '@/types/database.types'
import { NoteSlideOver } from '@/components/NoteSlideOver'

type Note = Database['public']['Tables']['notes']['Row'] & {
    user?: { codex_name: string | null, email: string }
}

import { toast } from "sonner"

export default function UserProfilePage() {
    const params = useParams()
    const userId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<{ codex_name: string | null } | null>(null)
    const [notes, setNotes] = useState<Note[]>([])
    const [totalXP, setTotalXP] = useState(0)
    const [isAdmin, setIsAdmin] = useState(false)

    // SlideOver State
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)

    useEffect(() => {
        if (!userId) return

        const fetchData = async () => {
            setLoading(true)

            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('users')
                .select('codex_name')
                .eq('id', userId)
                .single()
            setProfile(profileData)

            // 1.5 Check if Viewer is Admin
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            let adminStatus = false
            if (currentUser) {
                const { data: viewerData } = await supabase.from('users').select('is_admin').eq('id', currentUser.id).single()
                adminStatus = !!viewerData?.is_admin
                setIsAdmin(adminStatus)
            }

            // 2. Fetch Notes (Public for all, All for Admin)
            let notesData: Note[] = []
            let notesError = null

            if (adminStatus) {
                // Admin Mode: Use Secure RPC to bypass RLS
                const { data, error } = await supabase.rpc('get_admin_notes', {
                    target_user_id: userId
                })
                if (data) notesData = data as Note[]
                notesError = error
            } else {
                // Public Mode: Standard Query
                const { data, error } = await supabase
                    .from('notes')
                    .select(`
                        *,
                        user:users(codex_name, email)
                    `)
                    .eq('user_id', userId)
                    .eq('is_public', true)
                    .order('updated_at', { ascending: false })

                if (data) notesData = data as Note[]
                notesError = error
            }

            if (notesError) {
                console.error("Error fetching notes:", notesError)
                toast.error("Failed to load notes")
            } else {
                setNotes(notesData)
            }

            // 3. Fetch Points
            const { data: points } = await supabase
                .from('points')
                .select('amount')
                .eq('user_id', userId)

            const xp = points?.reduce((acc, curr) => acc + curr.amount, 0) || 0
            setTotalXP(xp)

            setLoading(false)
        }
        fetchData()
    }, [userId, supabase])

    if (loading) return <div className="p-8"><Skeleton className="h-48 w-full" /></div>

    if (!profile) return <div className="p-8 text-muted-foreground">User not found</div>

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-2 border-primary">
                    {profile.codex_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {profile.codex_name || "Unknown Scholar"}
                    </h1>
                    <p className="text-muted-foreground">
                        Level {Math.floor(totalXP / 100) + 1} Scribe • {notes.length} Public Scrolls
                    </p>
                </div>
            </div>

            {/* Public Notes Grid */}
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-primary" />
                        Public Codex
                    </h2>

                    {notes.length === 0 ? (
                        <div className="text-muted-foreground italic">No public notes published yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {notes.map(note => (
                                <FeedCard
                                    key={note.id}
                                    note={note}
                                    onClick={() => setSelectedNote(note)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Achievements */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AchievementsList userId={userId} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SlideOver for viewing notes */}
            <NoteSlideOver
                note={selectedNote}
                open={!!selectedNote}
                onClose={() => setSelectedNote(null)}
                onNavigate={(note) => setSelectedNote(note)}
            />
        </div>
    )
}

function AchievementsList({ userId }: { userId: string }) {
    const supabase = createClient()
    const [achievements, setAchievements] = useState<any[]>([])
    const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAchievements = async () => {
            setLoading(true)
            const { data: allAchievements } = await supabase
                .from('achievements')
                .select('*')
                .order('xp_reward', { ascending: true })

            const { data: myAchievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', userId)

            setAchievements(allAchievements || [])
            setUserAchievements(new Set(myAchievements?.map(a => a.achievement_id) || []))
            setLoading(false)
        }
        fetchAchievements()
    }, [userId, supabase])

    if (loading) return <Skeleton className="h-48 w-full" />

    // Only show unlocked achievements on public profile?
    // Or show all but greyscale? Let's show all but greyscale for now so people can see what they have.
    // Actually, usually on public profiles you only show what they HAVE.
    // Let's filter for ONLY unlocked ones for the public profile to keep it clean.

    const unlockedList = achievements.filter(a => userAchievements.has(a.id))

    if (unlockedList.length === 0) {
        return <div className="text-muted-foreground text-sm italic">No achievements earned yet.</div>
    }

    return (
        <div className="flex flex-col gap-3">
            {unlockedList.map((achievement) => (
                <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20"
                >
                    <div className="text-2xl">
                        {achievement.icon || '🏆'}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center gap-2">
                            <h4 className="font-semibold text-sm text-primary">
                                {achievement.name}
                            </h4>
                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                {achievement.xp_reward} XP
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {achievement.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
