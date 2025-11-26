import { FileText, BookOpen, Network, PenTool } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
    const actions = [
        {
            label: 'New Atom',
            description: 'Create a new idea',
            icon: FileText,
            href: '/notes',
            color: 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20'
        },
        {
            label: 'Notebook',
            description: 'View all your notes',
            icon: BookOpen,
            href: '/notebook',
            color: 'text-green-500 bg-green-500/10 hover:bg-green-500/20 border-green-500/20'
        },
        {
            label: 'Graph',
            description: 'Explore connections',
            icon: Network,
            href: '/graph',
            color: 'text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20'
        },
        {
            label: 'Reflection',
            description: 'Write a reflection',
            icon: PenTool,
            href: '/reflections',
            color: 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
        }
    ]

    return (
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
                const Icon = action.icon
                return (
                    <Link
                        key={action.label}
                        href={action.href}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${action.color}`}
                    >
                        <Icon className="h-6 w-6" />
                        <div className="text-center">
                            <p className="text-sm font-semibold">{action.label}</p>
                            <p className="text-xs opacity-70">{action.description}</p>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
