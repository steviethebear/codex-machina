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
    const [result, setResult] = useState<{ success: boolean, feedback: string, score: number } | null>(null)

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
        if (res.error) {
            toast.error(res.error)
            setIsSubmitting(false)
            return
        }

        setIsSubmitting(false)
        setResult({
            success: res.success || false,
            feedback: res.feedback || '',
            score: res.score || 0
        })
        setStep('result')

        if (res.success && onSuccess) {
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
                            <DialogTitle className={result?.success ? "text-green-600 flex items-center gap-2" : "text-amber-600 flex items-center gap-2"}>
                                {result?.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                {result?.success ? "Promotion Successful!" : "Promotion Failed"}
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                                <div className="space-y-2">
                                    <p className="font-medium text-foreground">Score: {result?.score}/4</p>
                                    <p className="text-sm bg-muted p-3 rounded-md">{result?.feedback}</p>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button onClick={reset}>
                                {result?.success ? "Close" : "Try Again"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
