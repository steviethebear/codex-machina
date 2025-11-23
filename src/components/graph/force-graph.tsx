'use client'

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
    return (
        <div className="border rounded-lg overflow-hidden bg-card">
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
                width={800} // Should be responsive, but fixed for now or use a wrapper ref
                height={600}
            />
        </div>
    )
}
