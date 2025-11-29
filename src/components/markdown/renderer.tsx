'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-slate dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl 
            prose-h4:text-lg prose-h5:text-base prose-h6:text-sm
            prose-p:leading-7 prose-li:leading-7
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:border
            ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                components={{
                    a: ({ href, children }) => {
                        if (href?.startsWith('/')) {
                            // Handle internal links (including wikilinks)
                            return (
                                <a
                                    href={href}
                                    onClick={(e) => {
                                        // Optional: intercept click if we want custom handling
                                        // For now, let it navigate or use Link if we import it
                                    }}
                                    className="text-blue-400 hover:underline cursor-pointer"
                                >
                                    {children}
                                </a>
                            )
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>
                    }
                }}
            >
                {content.replace(/\[\[(.*?)\]\]/g, (match, title) => `[${title}](/notebook?search=${encodeURIComponent(title)})`)}
            </ReactMarkdown>
        </div>
    )
}
