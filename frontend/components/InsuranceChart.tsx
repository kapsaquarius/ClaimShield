'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface InsuranceChartProps {
    data: { name: string; value: number }[];
}

export default function InsuranceChart({ data }: InsuranceChartProps) {
    return (
        // <ResponsiveContainer width="100%" height="100%">
        //     <AreaChart
        //         data={data}
        //         margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        //     >
        //         <defs>
        //             <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        //                 <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
        //                 <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
        //             </linearGradient>
        //         </defs>
        //         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        //         <XAxis
        //             dataKey="name"
        //             stroke="#94a3b8"
        //             tick={{ fill: '#94a3b8' }}
        //             axisLine={false}
        //             tickLine={false}
        //             dy={10}
        //         />
        //         <YAxis
        //             stroke="#94a3b8"
        //             tick={{ fill: '#94a3b8' }}
        //             axisLine={false}
        //             tickLine={false}
        //             dx={-10}
        //         />
        //         <Tooltip
        //             contentStyle={{
        //                 backgroundColor: '#1e293b',
        //                 borderColor: 'rgba(148, 163, 184, 0.2)',
        //                 color: '#f8fafc',
        //                 borderRadius: '12px'
        //             }}
        //             itemStyle={{ color: '#2dd4bf' }}
        //             cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
        //         />
        //         <Area
        //             type="monotone"
        //             dataKey="value"
        //             stroke="#2dd4bf"
        //             strokeWidth={4}
        //             fillOpacity={1}
        //             fill="url(#colorValue)"
        //             activeDot={{ r: 8, fill: '#2dd4bf', stroke: '#0f172a', strokeWidth: 4 }}
        //         />
        //     </AreaChart>
        // </ResponsiveContainer>
        <></>
    );
}
