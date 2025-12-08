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

        return node.color || '#00f0ff'
    }

    const getNodeVal = (node: any) => {
        let val = 1 // Base size

        // Scale by connection count - ALL nodes (clamped to prevent overflow)
        if (node.connection_count && node.connection_count > 0) {
            const scaledCount = Math.min(node.connection_count, 20) // Max 20 connections for scaling
            val *= 1 + (scaledCount * 0.3) // +30% per connection
        }

        // Make highlighted nodes slightly larger
        if (highlightNodes && highlightNodes.has(node.id)) val *= 1.3

        return val
    }

    const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Safety check for valid coordinates
        if (!isFinite(node.x) || !isFinite(node.y)) return

        const nodeVal = getNodeVal(node)
        const nodeRadius = Math.sqrt(nodeVal) * nodeRelSize * 0.5

        // Safety check for valid radius
        if (!isFinite(nodeRadius) || nodeRadius <= 0) return

        // Draw New Insight pulse if enabled and node is highlighted
        if (newInsight && highlightNodes && highlightNodes.has(node.id)) {
            const time = Date.now()
            const pulse = (Math.sin(time / 200) + 1) / 2 // 0 to 1
            const pulseRadius = nodeRadius * (1.5 + pulse * 0.5) // 1.5x to 2.0x

            ctx.beginPath()
            ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI)
            ctx.strokeStyle = `rgba(255, 230, 0, ${0.8 - pulse * 0.4})` // Yellow pulse
            ctx.lineWidth = 2 / globalScale
            ctx.stroke()

            // Label
            const fontSize = Math.max(10, 12 / globalScale)
            ctx.font = `bold ${fontSize}px Sans-Serif`
            ctx.fillStyle = '#ffe600'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText('New Insight', node.x, node.y - pulseRadius - 2)
        }

        // Draw hub glow if this is a hub node (FIRST, so it's behind)
        if (node.is_hub) {
            ctx.beginPath()
            ctx.arc(node.x, node.y, nodeRadius * 1.6, 0, 2 * Math.PI)
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeRadius * 1.6)
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)') // Brighter glow
            gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)')
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
            ctx.fillStyle = gradient
            ctx.fill()
        }

        // Draw node
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI)

        if (node.type === 'question') {
            ctx.fillStyle = '#f59e0b' // Amber-500
            ctx.fill()

            // Draw Question Mark
            ctx.fillStyle = '#000' // Black text for contrast
            const fontSize = Math.max(8, nodeRadius * 1.2)
            ctx.font = `bold ${fontSize}px Sans-Serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('?', node.x, node.y)
        } else {
            ctx.fillStyle = getNodeColor(node)
            ctx.fill()
        }

        // Draw label only if enabled (SMALLER fonts)
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
        // Tune physics when graph loads
        if (fgRef.current) {
            // Stronger repulsion to prevent overlap
            fgRef.current.d3Force('charge').strength(-100)
            // Shorter links to keep connected nodes close
            fgRef.current.d3Force('link').distance(40)
        }
    }, [])

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]">
            {/* Label Toggle Button */}
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
