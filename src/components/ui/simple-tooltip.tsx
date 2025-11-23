import React, { useState } from 'react'

interface SimpleTooltipProps {
    content: string
    children: React.ReactNode
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
}

export function SimpleTooltip({ content, children, side = 'top', align = 'center' }: SimpleTooltipProps) {
    const [isVisible, setIsVisible] = useState(false)

    // Alignment logic for top/bottom sides
    const xAlignClass = {
        start: 'left-0',
        center: 'left-1/2 -translate-x-1/2',
        end: 'right-0'
    }

    // Arrow alignment logic
    const arrowXAlignClass = {
        start: 'left-4',
        center: 'left-1/2 -translate-x-1/2',
        end: 'right-4'
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`
                    absolute z-50 px-3 py-2 text-xs font-medium text-white bg-black rounded shadow-md w-max max-w-[200px]
                    ${side === 'top' ? `bottom-full mb-2 ${xAlignClass[align]}` : ''}
                    ${side === 'bottom' ? `top-full mt-2 ${xAlignClass[align]}` : ''}
                    ${side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
                    ${side === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
                `}>
                    {content}
                    {/* Arrow */}
                    <div className={`
                        absolute w-2 h-2 bg-black transform rotate-45
                        ${side === 'top' ? `top-full -mt-1 ${arrowXAlignClass[align]}` : ''}
                        ${side === 'bottom' ? `bottom-full -mb-1 ${arrowXAlignClass[align]}` : ''}
                        ${side === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
                        ${side === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
                    `} />
                </div>
            )}
        </div>
    )
}
