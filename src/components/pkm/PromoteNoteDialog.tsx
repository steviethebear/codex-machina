import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle } from "lucide-react"
import { promoteNote, updateNote } from "@/lib/actions/notes"
import { toast } from "sonner"
import { Database } from "@/types/database.types"

type Note = Database['public']['Tables']['notes']['Row']

interface PromoteNoteDialogProps {
    note: Note
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (updatedNote: Note) => void
}

import { useRouter } from "next/navigation"

export function PromoteNoteDialog({ note, open, onOpenChange, onSuccess }: PromoteNoteDialogProps) {
    const router = useRouter()
    const [title, setTitle] = useState(note.title)
    const [step, setStep] = useState<'input' | 'result'>('input')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ success: boolean, feedback: string, violations?: string[], observations?: string[] } | null>(null)

    useEffect(() => {
        if (open) {
            setTitle(note.title)
        }
    }, [open, note.title])

    const handlePromote = async () => {
        // 1. Validate Title
        const titleToCheck = title
        const isTimestamp = /^\d+$/.test(titleToCheck?.replace(/[-:T]/g, '') || '') || /^\d{4}-\d{2}-\d{2}/.test(titleToCheck || '')

        if (!titleToCheck || titleToCheck.trim() === 'Untitled' || titleToCheck.trim() === 'Untitled Note' || isTimestamp) {
            toast.error("Please give your note a descriptive title before promoting.")
            return
        }

        if (!note.content || note.content.trim().length === 0) {
            toast.error("Note content cannot be empty.")
            return
        }

        setIsSubmitting(true)

        // 2. Save Title First (if changed)
        if (title !== note.title) {
            const upRes = await updateNote(note.id, { title })
            if (upRes.error) {
                toast.error("Failed to update title")
                setIsSubmitting(false)
                return
            }
        }

        // 3. Promote
        const res = await promoteNote(note.id)

        // Handle Error (System/Network)
        if ('error' in res && res.error) {
            toast.error(res.error)
            setIsSubmitting(false)
            return
        }

        // Handle Success or Block
        const response = res as any; // Cast to bypass previous type for now or rely on inference

        setIsSubmitting(false)
        setResult({
            success: response.success || false,
            feedback: response.feedback || '',
            violations: response.violations,
            observations: response.observations
        })
        setStep('result')

        if (response.success && onSuccess) {
            // Construct optimistic update
            const updatedNote: Note = {
                ...note,
                title: title,
                type: 'permanent',
                is_public: true,
                updated_at: new Date().toISOString()
            }
            onSuccess(updatedNote)

            // Redirect to the new note in the notebook view
            router.push(`/my-notes?noteId=${note.id}`)
        }
    }

    const reset = () => {
        setStep('input')
        setResult(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) reset()
            else onOpenChange(true)
        }}>
            <DialogContent>
                {step === 'input' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Promote to Permanent Note</DialogTitle>
                            <DialogDescription>
                                Permanent notes are public and contribute to your Codex score.
                                Please ensure your note has a clear, descriptive title.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label>Note Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., The Impact of Agentic Workflow..."
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handlePromote} disabled={isSubmitting}>
                                {isSubmitting ? "Promoting..." : "Promote"}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className={result?.success ? "text-green-600 flex items-center gap-2" : "text-destructive flex items-center gap-2"}>
                                {result?.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                {result?.success ? "Promotion Successful!" : "Cannot Promote Yet"}
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-left">
                                <div className="space-y-3">
                                    <p className="text-foreground font-medium">{result?.feedback}</p>

                                    {/* Violations */}
                                    {result?.violations && result.violations.length > 0 && (
                                        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive border border-destructive/20">
                                            <p className="font-semibold mb-1">Issues to Resolve:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {result.violations.map((v, i) => (
                                                    <li key={i}>{v}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Observations */}
                                    {result?.observations && result.observations.length > 0 && (
                                        <div className="bg-muted p-3 rounded-md text-sm border">
                                            <p className="font-semibold mb-1 text-muted-foreground">Diagnostics:</p>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                {result.observations.map((o: string, i: number) => (
                                                    <li key={i}>{o}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button onClick={reset}>
                                {result?.success ? "Close" : "Back to Edit"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
