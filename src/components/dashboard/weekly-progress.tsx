'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WeeklyProgressProps {
    data: {
        day: string
        xp: number
        sp_reading: number
        sp_thinking: number
        sp_writing: number
        sp_engagement: number
        actions: number
    }[]
}

export function WeeklyProgress({ data }: WeeklyProgressProps) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="day"
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                    dataKey="xp"
                    fill="hsl(var(--primary))"
                    radius={[0, 0, 0, 0]}
                    name="XP"
                    stackId="a"
                />
                <Bar
                    dataKey="sp_reading"
                    fill="rgb(96 165 250)"
                    radius={[0, 0, 0, 0]}
                    name="Reading SP"
                    stackId="a"
                />
                <Bar
                    dataKey="sp_thinking"
                    fill="rgb(192 132 252)"
                    radius={[0, 0, 0, 0]}
                    name="Thinking SP"
                    stackId="a"
                />
                <Bar
                    dataKey="sp_writing"
                    fill="rgb(74 222 128)"
                    radius={[0, 0, 0, 0]}
                    name="Writing SP"
                    stackId="a"
                />
                <Bar
                    dataKey="sp_engagement"
                    fill="rgb(251 113 133)"
                    radius={[4, 4, 0, 0]}
                    name="Engagement SP"
                    stackId="a"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
