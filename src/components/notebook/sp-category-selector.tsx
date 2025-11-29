'use client'

import { Info } from 'lucide-react'
import { useState } from 'react'

export type SPCategory = 'thinking' | 'reading' | 'writing' | 'engagement'

interface SPCategorySelectorProps {
    category: SPCategory
    onChange: (category: SPCategory) => void
    inferredCategory: SPCategory
    disabled?: boolean
}

const CATEGORY_INFO: Record<SPCategory, { label: string; tooltip: string; color: string }> = {
    thinking: {
        label: 'Thinking SP',
        tooltip: 'Critical analysis, questions, connections',
        color: 'text-cyan-400'
    },
    reading: {
        label: 'Reading SP',
        tooltip: 'Engaging with texts and citations',
        color: 'text-purple-400'
    },
    writing: {
        label: 'Writing SP',
        tooltip: 'Reflections and structured writing',
        color: 'text-blue-400'
    },
    engagement: {
        label: 'Engagement SP',
        tooltip: 'Personal insights and participation',
        color: 'text-green-400'
    }
}

export function SPCategorySelector({ category, onChange, inferredCategory, disabled = false }: SPCategorySelectorProps) {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">SP Category:</label>
            <select
                value={category}
                onChange={(e) => onChange(e.target.value as SPCategory)}
                disabled={disabled}
                className="bg-[#1e1e1e] border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
                <option value="thinking">Thinking SP</option>
                <option value="reading">Reading SP</option>
                <option value="writing">Writing SP</option>
                <option value="engagement">Engagement SP</option>
            </select>

            {category !== inferredCategory && (
                <span className="text-[10px] text-gray-500 italic">
                    (inferred: {CATEGORY_INFO[inferredCategory].label})
                </span>
            )}

            <div className="relative">
                <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-gray-500 hover:text-gray-400 transition-colors"
                    aria-label="SP Category Information"
                >
                    <Info className="h-3.5 w-3.5" />
                </button>
                {showTooltip && (
                    <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs space-y-2">
                        {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                            <div key={key}>
                                <span className={`font-medium ${info.color}`}>{info.label}:</span>
                                <span className="text-gray-400"> {info.tooltip}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
