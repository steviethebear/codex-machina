import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface NoteDetailSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    note: any | null; // typing 'any' for now to match rapid dev, ideally typed strictly
}

export function NoteDetailSheet({ isOpen, onOpenChange, note }: NoteDetailSheetProps) {
    if (!note) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{note.type}</Badge>
                        {note.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                        ))}
                    </div>
                    <SheetTitle className="text-2xl font-bold leading-tight">
                        {note.title}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-2">
                        <span>By {note.author_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mr-6 pr-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {/* Simple whitespace handling, ideally use a markdown renderer here */}
                        <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                            {note.content}
                        </div>
                    </div>

                    {note.citation && (
                        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
                            <span className="font-semibold block mb-1">Citation/Source:</span>
                            <p className="italic">{note.citation}</p>
                        </div>
                    )}
                </ScrollArea>

                <div className="pt-6 mt-auto border-t">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`/my-notes?noteId=${note.id}`, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Notebook
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
