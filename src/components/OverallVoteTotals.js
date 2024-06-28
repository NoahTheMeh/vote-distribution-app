import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const OverallVoteTotals = ({ votesData }) => {
    if (!votesData) {
        return <div>Loading...</div>;
    }

    // Calculate overall vote totals dynamically
    console.log(votesData);
    const totalVotes = votesData.reduce((acc, vote) => {
        Object.keys(vote).forEach(key => {
            if (key !== 'Precinct') {
                if (!acc[key]) {
                    acc[key] = 0;
                }
                acc[key] += +vote[key];
            }
        });
        return acc;
    }, {});

    const totalVoteCount = Object.values(totalVotes).reduce((acc, value) => acc + value, 0);

    const data = Object.keys(totalVotes).map(key => ({
        name: key,
        value: totalVotes[key],
        percentage: ((totalVotes[key] / totalVoteCount) * 100).toFixed(2)
    })).filter(item => item.value > 0); // Filter out zero values

    const COLORS = ['#FF0000', '#0000FF', '#00FF00', '#FFA500', '#800080', '#FFFF00'];

    return (
        <div>
            <h2>Overall Vote Totals</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <BarChart width={500} height={300} data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Bar dataKey="value" fill="#8884d8">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
                <PieChart width={400} height={400}>
                    <Pie
                        data={data}
                        cx={200}
                        cy={200}
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value, name, entry) => `${entry.payload.percentage}%`} />
                    <Legend />
                </PieChart>
            </div>
        </div>
    );
};

export default OverallVoteTotals;
