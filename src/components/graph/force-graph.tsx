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
}

export default function ForceGraph({ data, onNodeClick }: ForceGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [graphWidth, setGraphWidth] = useState(800) // Default or initial values
    const [graphHeight, setGraphHeight] = useState(600)

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setGraphWidth(containerRef.current.offsetWidth)
                setGraphHeight(containerRef.current.offsetHeight)
            }
        }

        // Initial dimensions
        updateDimensions()

        // Set up ResizeObserver
        const observer = new ResizeObserver(updateDimensions)
        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        // Cleanup
        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [])

    return (
        <div ref={containerRef} className="border rounded-lg overflow-hidden bg-card w-full h-full">
            <ForceGraph2D
                graphData={data}
                nodeLabel="name"
                nodeColor={(node: any) => node.color || '#00f0ff'}
                linkColor={() => '#555'}
                backgroundColor="#0a0a0f"
                onNodeClick={onNodeClick}
                nodeRelSize={6}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                width={graphWidth}
                height={graphHeight}
            />
        </div>
    )
}
