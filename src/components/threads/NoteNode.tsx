import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Edit2 } from 'lucide-react';

type NoteNodeData = {
    title: string;
    content: string;
    author: string;
    groupLabel?: string;
    onLabelClick?: () => void;
};

type CustomNoteNode = Node<NoteNodeData, 'note'>;

const NoteNode = ({ data, selected }: NodeProps<CustomNoteNode>) => {
    const { title, content, author, groupLabel, onLabelClick } = data;

    return (
        <Card
            className={cn(
                "w-[300px] shadow-sm transition-all duration-200 bg-card",
                selected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-muted-foreground/50 border-2 border-background"
            />

            <CardHeader className="p-4 pb-2 space-y-2">
                {/* Group Label */}
                {groupLabel && (
                    <div
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground w-fit mb-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            onLabelClick?.();
                        }}
                    >
                        {groupLabel}
                    </div>
                )}

                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                    {title}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                    by {author}
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground line-clamp-4 font-serif leading-relaxed">
                    {content}
                </p>
            </CardContent>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-muted-foreground/50 border-2 border-background"
            />
        </Card>
    );
};

export default memo(NoteNode);
