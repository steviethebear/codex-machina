'use client'

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div>Loading Graph...</div>
})

interface GraphData {
    nodes: { id: string; name: string; val: number; color?: string; type: string }[]
    links: { source: string; target: string }[]
}

interface ForceGraphProps {
    data: GraphData
    onNodeClick?: (node: any) => void
    onNodeHover?: (node: any) => void
    highlightNodes?: Set<string>
    filterType?: string | null
}

export default function ForceGraph({ data, onNodeClick, onNodeHover, highlightNodes, filterType }: ForceGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [graphWidth, setGraphWidth] = useState(800)
    const [graphHeight, setGraphHeight] = useState(600)

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setGraphWidth(containerRef.current.offsetWidth)
                setGraphHeight(containerRef.current.offsetHeight)
            }
        }

        updateDimensions()
        const observer = new ResizeObserver(updateDimensions)
        if (containerRef.current) observer.observe(containerRef.current)

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current)
        }
    }, [])

    const getNodeColor = (node: any) => {
        // If a filter is active and node doesn't match, dim it
        if (filterType && node.type !== filterType && node.type !== 'text') return '#333'

        // If search/highlight is active and node isn't in set, dim it
        if (highlightNodes && highlightNodes.size > 0 && !highlightNodes.has(node.id)) return '#333'

        return node.color || '#00f0ff'
    }

    const getNodeVal = (node: any) => {
        let val = node.val || 1
        // Make highlighted nodes slightly larger
        if (highlightNodes && highlightNodes.has(node.id)) val *= 1.5
        return val
    }

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]">
            <ForceGraph2D
                graphData={data}
                nodeLabel="name"
                nodeColor={getNodeColor}
                nodeVal={getNodeVal}
                linkColor={() => '#444'}
                backgroundColor="#0a0a0f"
                onNodeClick={onNodeClick}
                onNodeHover={onNodeHover}
                nodeRelSize={8}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                width={graphWidth}
                height={graphHeight}
            />
        </div>
    )
}
