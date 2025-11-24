'use client'

import { useEffect, useState } from 'react'
import { getNodesPerUnit } from '@/lib/actions/get-analytics'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function UnitStats() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const stats = await getNodesPerUnit()
            setData(stats)
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-4">Loading unit stats...</div>

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="unit" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="idea" stackId="a" fill="#00f0ff" name="Ideas" />
                <Bar dataKey="question" stackId="a" fill="#ff003c" name="Questions" />
                <Bar dataKey="quote" stackId="a" fill="#7000ff" name="Quotes" />
                <Bar dataKey="insight" stackId="a" fill="#ffe600" name="Insights" />
            </BarChart>
        </ResponsiveContainer>
    )
}
