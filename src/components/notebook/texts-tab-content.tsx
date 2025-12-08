'use client'

import { EmptyState } from './empty-state'
import { NotebookLayout } from './notebook-layout'

export function TextsTabContent() {
    const sidebar = (
        <>
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Course Texts
                </h3>
            </div>

            {/* Texts List Placeholder */}
            <div className="flex-1 overflow-y-auto p-4 text-center text-sm text-muted-foreground">
                No texts available
            </div>
        </>
    )

    return (
        <NotebookLayout sidebar={sidebar}>
            <EmptyState
                icon="📚"
                title="Select a text"
                description="Course readings and texts will appear in the sidebar. Select one to view it and create atoms from it."
            />
        </NotebookLayout>
    )
}
