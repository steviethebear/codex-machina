'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getStudentProfile, awardXP, forceDeleteNote, forcePromoteNote, deleteStudent, sendPasswordReset, updateStudentPassword, updateStudentProfile, reindexAllConnections } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Trash2, Award, FileText, Activity, AlertTriangle, Key, Mail, ShieldAlert, MessageSquare, Network } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { NoteSlideOver } from '@/components/NoteSlideOver'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { toggleUnlock } from '@/lib/actions/unlocks'
import { Switch } from '@/components/ui/switch'

export default function StudentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [profile, setProfile] = useState<any>(null)
    const [notes, setNotes] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [reflections, setReflections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Action States
    const [xpAmount, setXpAmount] = useState('50')
    const [xpReason, setXpReason] = useState('Excellent contribution')
    const [isAwarding, setIsAwarding] = useState(false)
    const [awardDialogOpen, setAwardDialogOpen] = useState(false)
    const [editProfileOpen, setEditProfileOpen] = useState(false)

    // Password States
    const [newPassword, setNewPassword] = useState('')
    const [isUpdatingAuth, setIsUpdatingAuth] = useState(false)

    // Sheet and Chart States
    const [selectedNote, setSelectedNote] = useState<any>(null)
    const [xpChartData, setXpChartData] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        const data = await getStudentProfile(id)
        if (data) {
            setProfile(data.profile)
            setNotes(data.notes)
            setHistory(data.points)
            setReflections(data.reflections)

            // Process XP for Chart: Accumulate over time
            const sortedHistory = [...data.points].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            let cumulative = 0
            const chartData = sortedHistory.map(h => {
                cumulative += h.amount
                return {
                    date: new Date(h.created_at).toLocaleDateString(),
                    xp: cumulative,
                    amount: h.amount,
                    reason: h.reason
                }
            })
            setXpChartData(chartData)
        }
        setLoading(false)
    }

    const handleAwardXP = async () => {
        setIsAwarding(true)
        try {
            await awardXP(id, parseInt(xpAmount), xpReason)
            toast.success(`Awarded ${xpAmount} XP to student`)
            loadData()
            setAwardDialogOpen(false)
        } catch (e) {
            toast.error("Failed to award XP")
        }
        setIsAwarding(false)
    }

    const handlePromote = async (noteId: string) => {
        await forcePromoteNote(noteId)
        toast.success("Note promoted to Permanent")
        loadData()
    }

    const handleDelete = async (noteId: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return
        await forceDeleteNote(noteId)
        toast.success("Note deleted")
        loadData()
    }

    const handleDeleteStudent = async () => {
        const confirmText = prompt("Type 'DELETE' to confirm wiping this user and all data.")
        if (confirmText === 'DELETE') {
            try {
                await deleteStudent(id)
                toast.success("User deleted")
                router.push('/admin')
            } catch (e) {
                toast.error("Failed to delete user")
                console.error(e)
            }
        }
    }

    const handleSendReset = async () => {
        if (!confirm("Send password reset email to student?")) return
        setIsUpdatingAuth(true)
        try {
            await sendPasswordReset(profile.email)
            toast.success("Reset email sent")
        } catch (e) {
            toast.error("Failed to send reset email")
        }
        setIsUpdatingAuth(false)
    }

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) return toast.error("Password must be at least 6 characters")
        if (!confirm("Manually override student password? They will need this new password to login.")) return

        setIsUpdatingAuth(true)
        try {
            await updateStudentPassword(id, newPassword)
            toast.success("Password updated successfully")
            setNewPassword('')
        } catch (e) {
            toast.error("Failed to update password")
        }
        setIsUpdatingAuth(false)
    }

    if (loading) return <div className="p-8">Loading student profile...</div>
    if (!profile) return <div className="p-8">Student not found</div>

    return (
        <div className="flex flex-col h-full bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{profile.codex_name}</h2>
                        <p className="text-muted-foreground">{profile.email}</p>
                    </div>
                </div>
                {/* Header Badges for Unlocks (Quick View) */}
                <div className="flex gap-2 ml-4 flex-1">
                    {profile.unlocks?.map((u: any) => (
                        <Badge key={u.feature} variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                            {u.feature.replace('_', ' ')}
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                        if (!confirm("Re-index all note connections for this student? This may take a moment.")) return
                        const result = await reindexAllConnections(id)
                        toast.success(`Indexed ${result.count} notes, found ${result.links} connections.`)
                        loadData()
                    }}>
                        <Network className="h-4 w-4 mr-2" />
                        Re-index
                    </Button>

                    <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">Edit Profile</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Student Profile</DialogTitle>
                                <DialogDescription>Update cohort and teacher assignments.</DialogDescription>
                            </DialogHeader>
                            <ActionForm profile={profile} onSave={async (data: any) => {
                                await updateStudentProfile(profile.id, data)
                                toast.success("Profile updated")
                                loadData()
                                setEditProfileOpen(false)
                            }} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Award className="h-4 w-4 mr-2" />
                                Award XP
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Award Bonus XP</DialogTitle>
                                <DialogDescription>Grant extra credit or reward exceptional work.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input type="number" value={xpAmount} onChange={e => setXpAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Input value={xpReason} onChange={e => setXpReason(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAwardXP} disabled={isAwarding}>Award Points</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="destructive" onClick={handleDeleteStudent}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                    </Button>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="notes" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="notes">Notes Management</TabsTrigger>
                    <TabsTrigger value="reflections">Reflections</TabsTrigger>
                    <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                    <TabsTrigger value="history">XP History</TabsTrigger>
                    <TabsTrigger value="security" className="text-orange-600 data-[state=active]:text-orange-700">Account Security</TabsTrigger>
                </TabsList>

                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Notes</CardTitle>
                            <CardDescription>Review, promote, or remove content.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Title</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notes.map((note) => (
                                            <tr
                                                key={note.id}
                                                className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                                                onClick={() => setSelectedNote(note)}
                                            >
                                                <td className="p-4 align-middle font-medium text-primary hover:underline">{note.title || "Untitled"}</td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={note.type === 'permanent' ? 'default' : 'secondary'}>
                                                        {note.type}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">{new Date(note.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 align-middle text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                                    {note.type === 'fleeting' && (
                                                        <Button size="sm" variant="ghost" onClick={() => handlePromote(note.id)}>
                                                            Promote
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(note.id)}>
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reflections">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reflection History</CardTitle>
                            <CardDescription>View status and transcripts of AI-guided reflections.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Context</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reflections.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground italic">No reflections assigned.</td>
                                            </tr>
                                        )}
                                        {reflections.map((r) => (
                                            <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">{r.context}</td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={
                                                        r.status === 'completed' ? 'default' :
                                                            r.status === 'in_progress' ? 'secondary' : 'outline'
                                                    } className={r.status === 'pending' ? 'animate-pulse' : ''}>
                                                        {r.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/reflections/${r.id}`)}>
                                                        <MessageSquare className="h-4 w-4 mr-1" />
                                                        View Transcript
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>XP Progression</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={xpChartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <Line type="monotone" dataKey="xp" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>XP Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {history.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium">{entry.reason}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 bg-green-50">+{entry.amount} XP</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Password Reset Email
                                </CardTitle>
                                <CardDescription>Send a system email to the student to reset their password safely.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleSendReset} disabled={isUpdatingAuth}>
                                    Send Reset Link
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-orange-200 bg-orange-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-700">
                                    <ShieldAlert className="h-5 w-5" />
                                    Manual Override
                                </CardTitle>
                                <CardDescription>Manually set a temporary password. Only use if email is inaccessible.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter new password..."
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="border-orange-200 hover:bg-orange-100 hover:text-orange-900"
                                    onClick={handleUpdatePassword}
                                    disabled={!newPassword || isUpdatingAuth}
                                >
                                    <Key className="mr-2 h-4 w-4" />
                                    Update Password
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="capabilities">
                    <Card>
                        <CardHeader>
                            <CardTitle>Unlocked Capabilities</CardTitle>
                            <CardDescription>Manually grant or revoke system capabilities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {[
                                    { key: 'thinking_profile', label: 'Thinking Profile', desc: 'Visualization of engagement patterns (rhythm, density).' },
                                    { key: 'graph_view', label: 'Knowledge Graph', desc: 'Network visualization of notes and connections.' },
                                    { key: 'threads', label: 'Threads', desc: 'Ability to stitch notes into linear narratives.' },
                                    { key: 'deep_breadcrumbs', label: 'Extended Breadcrumbs', desc: 'Longer history and persistence.' },
                                    { key: 'smart_connections', label: 'Smart Connections', desc: 'AI-powered suggestions for related notes.' }
                                ].map((cap) => {
                                    const isUnlocked = profile?.unlocks?.some((u: any) => u.feature === cap.key)
                                    return (
                                        <div key={cap.key} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{cap.label}</div>
                                                <div className="text-xs text-muted-foreground">{cap.desc}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={isUnlocked}
                                                    onCheckedChange={async (checked) => {
                                                        await toggleUnlock(id, cap.key, checked)
                                                        toast.success(`${cap.label} ${checked ? 'unlocked' : 'locked'}`)
                                                        loadData()
                                                    }}
                                                />
                                                <span className="text-sm text-muted-foreground w-16 text-right">
                                                    {isUnlocked ? 'Active' : 'Locked'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <NoteSlideOver
                open={!!selectedNote}
                note={selectedNote}
                onClose={() => setSelectedNote(null)}
                onNavigate={(n) => setSelectedNote(n)}
            // In Admin view, we might not want to drill down further or it might be confusing
            // But we can enable it if we assume all notes are viewable.
            // For now, let's keep it simple.
            />
        </div>
    )
}

function ActionForm({ profile, onSave }: { profile: any, onSave: (data: any) => Promise<void> }) {
    const [name, setName] = useState(profile.codex_name || '')
    const [section, setSection] = useState(profile.class_section || '')
    const [teacher, setTeacher] = useState(profile.teacher || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await onSave({ codex_name: name, class_section: section, teacher })
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Codex Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Section</Label>
                    <Input value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. 5A" />
                </div>
                <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Input value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="e.g. Mr. Smith" />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
        </form>
    )
}
