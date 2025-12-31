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
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Add New Source</DialogTitle>
                            <DialogDescription>
                                Add a book, article, or video to the class library.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="author" className="text-right">
                                    Author
                                </Label>
                                <Input
                                    id="author"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="url" className="text-right">
                                    URL
                                </Label>
                                <Input
                                    id="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Type
                                </Label>
                                <div className="col-span-3">
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="article">Article</SelectItem>
                                            <SelectItem value="book">Book</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="website">Website</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Adding..." : "Add Source"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
