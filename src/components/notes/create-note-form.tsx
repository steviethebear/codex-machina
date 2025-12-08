'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNote } from '@/lib/actions/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'

export function CreateNoteForm() {
    const router = useRouter()
    const { user } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [noteType, setNoteType] = useState('fleeting')

    // Form States
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [citation, setCitation] = useState('')
    const [pageNumber, setPageNumber] = useState('')

    const handleSubmit = async () => {
        if (!user) return
        setIsSubmitting(true)

        try {
            const isPublic = noteType !== 'fleeting' // Fleeting is private, others public

            const result = await createNote({
                user_id: user.id,
                title,
                content,
                type: noteType as 'fleeting' | 'literature' | 'permanent',
                is_public: isPublic,
                citation: noteType === 'literature' ? citation : null,
                page_number: noteType === 'literature' ? pageNumber : null,
            })

            if (result.error) {
                alert('Error creating note: ' + result.error)
            } else {
                router.push('/dashboard')
            }
        } catch (e) {
            console.error(e)
            alert('An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Create New Note</h1>

            <Tabs defaultValue="fleeting" onValueChange={setNoteType} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="fleeting">Fleeting Note</TabsTrigger>
                    <TabsTrigger value="literature">Literature Note</TabsTrigger>
                    <TabsTrigger value="permanent">Permanent Note</TabsTrigger>
                </TabsList>

                {/* FLEETING NOTE */}
                <TabsContent value="fleeting">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fleeting Note</CardTitle>
                            <CardDescription>
                                Quick capture of thoughts. Private to you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="f-title">Title</Label>
                                <Input id="f-title" placeholder="Short summary..." value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="f-content">Content</Label>
                                <Textarea
                                    id="f-content"
                                    placeholder="What's on your mind? Capture it quick."
                                    className="min-h-[200px]"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Fleeting Note'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* LITERATURE NOTE */}
                <TabsContent value="literature">
                    <Card>
                        <CardHeader>
                            <CardTitle>Literature Note</CardTitle>
                            <CardDescription>
                                Deep engagement with a source. Public to class.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="l-citation">Source Citation (MLA)</Label>
                                <Input id="l-citation" placeholder="Author, Title, Publisher, Year..." value={citation} onChange={e => setCitation(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="l-page">Page Number (Optional)</Label>
                                <Input id="l-page" placeholder="p. 42" value={pageNumber} onChange={e => setPageNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="l-title">Title</Label>
                                <Input id="l-title" placeholder="Main idea identifier..." value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="l-content">Paraphrased Content</Label>
                                <Textarea
                                    id="l-content"
                                    placeholder="Summarize the idea in your own words. Do not quote directly."
                                    className="min-h-[200px]"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Publishing...' : 'Publish Literature Note'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* PERMANENT NOTE */}
                <TabsContent value="permanent">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permanent Note</CardTitle>
                            <CardDescription>
                                Synthesized knowledge. One idea, one note. Public to class.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="p-title">Claim / Title</Label>
                                <Input id="p-title" placeholder="State your claim clearly..." value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="p-content">Reasoning & Evidence</Label>
                                <Textarea
                                    id="p-content"
                                    placeholder="Explain your reasoning. Connect ideas from your literature notes."
                                    className="min-h-[300px]"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Publishing...' : 'Publish Permanent Note'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
