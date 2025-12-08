'use client'

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div>Loading Graph...</div>
})

interface GraphData {
    nodes: { id: string; name: string; val: number; color?: string; type: string; is_hub?: boolean; connection_count?: number }[]
    links: { source: string; target: string }[]
}

interface ForceGraphProps {
    data: GraphData
    onNodeClick?: (node: any) => void
    onNodeHover?: (node: any) => void
    highlightNodes?: Set<string>
    filterType?: string | null
    nodeRelSize?: number
    newInsight?: boolean
}

export default function ForceGraph({ data, onNodeClick, onNodeHover, highlightNodes, filterType, nodeRelSize = 12, newInsight = false }: ForceGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [graphWidth, setGraphWidth] = useState(800)
    const [graphHeight, setGraphHeight] = useState(600)
    const [showLabels, setShowLabels] = useState(false)

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

        if (node.type === 'fleeting') return '#a1a1aa' // Grey
        if (node.type === 'literature') return '#60a5fa' // Blue
        if (node.type === 'permanent') return '#34d399' // Green
        if (node.type === 'text') return '#ffffff' // White

        return node.color || '#00f0ff'
    }

    const getNodeVal = (node: any) => {
        let val = 1 // Base size

        // Scale by connection count
        if (node.connection_count && node.connection_count > 0) {
            const scaledCount = Math.min(node.connection_count, 20)
            val *= 1 + (scaledCount * 0.3)
        }

        // Make highlighted nodes slightly larger
        if (highlightNodes && highlightNodes.has(node.id)) val *= 1.3

        return val
    }

    const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!isFinite(node.x) || !isFinite(node.y)) return

        const nodeVal = getNodeVal(node)
        const nodeRadius = Math.sqrt(nodeVal) * nodeRelSize * 0.5

        if (!isFinite(nodeRadius) || nodeRadius <= 0) return

        // Draw node
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI)
        ctx.fillStyle = getNodeColor(node)
        ctx.fill()

        // Draw label only if enabled
        if (showLabels) {
            const label = node.name || node.id
            const fontSize = Math.max(8, 10 / globalScale)
            ctx.font = `${fontSize}px Sans-Serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#fff'
            ctx.fillText(label, node.x, node.y + nodeRadius + fontSize * 1.2)
        }
    }

    const fgRef = useRef<any>(null)

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-100)
            fgRef.current.d3Force('link').distance(40)
        }
    }, [])

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                className="absolute top-4 right-4 z-10 gap-2"
            >
                {showLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showLabels ? 'Hide' : 'Show'} Labels
            </Button>

            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                nodeLabel="name"
                nodeColor={getNodeColor}
                nodeVal={getNodeVal}
                linkColor={() => '#444'}
                backgroundColor="#0a0a0f"
                onNodeClick={onNodeClick}
                onNodeHover={onNodeHover}
                nodeRelSize={nodeRelSize}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                width={graphWidth}
                height={graphHeight}
                nodeCanvasObject={nodeCanvasObject}
                d3VelocityDecay={0.3}
                d3AlphaDecay={0.02}
                cooldownTicks={100}
                onEngineStop={() => { }}
            />
        </div>
    )
}
