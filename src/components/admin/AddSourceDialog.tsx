'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSource } from "@/lib/actions/sources"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { SourceForm } from "@/components/admin/SourceForm"

export function AddSourceDialog({ onSourceAdded }: { onSourceAdded?: (source: any) => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        url: "",
        type: "article"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createSource(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Source added successfully")
                if (onSourceAdded && result.data) {
                    onSourceAdded(result.data)
                }
                setOpen(false)
                setFormData({ title: "", author: "", url: "", type: "article" })
            }
        } catch (error) {
            toast.error("Failed to add source")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant="default"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={() => setOpen(true)}
            >
                <PlusCircle className="h-4 w-4" />
                Add Source
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>Add New Source</DialogTitle>
                        <DialogDescription>
                            Add a book, article, video, or short story to the class library.
                        </DialogDescription>
                    </DialogHeader>
                    <SourceForm
                        onSubmit={async (data) => {
                            setLoading(true)
                            try {
                                const result = await createSource(data)
                                if (result.error) {
                                    toast.error(result.error)
                                } else {
                                    toast.success("Source added successfully")
                                    if (onSourceAdded && result.data) {
                                        onSourceAdded(result.data)
                                    }
                                    setOpen(false)
                                }
                            } catch (error) {
                                toast.error("Failed to add source")
                                console.error(error)
                            } finally {
                                setLoading(false)
                            }
                        }}
                        isLoading={loading}
                        submitLabel="Add Source"
                        onCancel={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
