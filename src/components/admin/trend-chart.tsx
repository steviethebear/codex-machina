'use client'

import { useEffect, useState } from 'react'
import { getSPTrends } from '@/lib/actions/get-analytics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendCharaProps {
    userId: string
}

export function TrendChart({ userId }: TrendCharaProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const trends = await getSPTrends(userId, 30)
            setData(trends)
            setLoading(false)
        }
        fetchData()
    }, [userId])

    if (loading) return <div className="p-4">Loading trends...</div>

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sp_thinking" stroke="#8b5cf6" name="Thinking SP" />
                <Line type="monotone" dataKey="sp_reading" stroke="#3b82f6" name="Reading SP" />
                <Line type="monotone" dataKey="sp_writing" stroke="#10b981" name="Writing SP" />
                <Line type="monotone" dataKey="sp_engagement" stroke="#f59e0b" name="Engagement SP" />
            </LineChart>
        </ResponsiveContainer>
    )
}
