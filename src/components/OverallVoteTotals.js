import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const OverallVoteTotals = ({ votesData, colors, selectedDataSource, votesData22 }) => {
    if (!votesData) {
        return <div>Loading...</div>;
    }

    // Calculate overall vote totals dynamically
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

    const totalVotes22 = votesData22.reduce((acc, vote) => {
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
    const totalVoteCount22 = Object.values(totalVotes22).reduce((acc, value) => acc + value, 0);

    console.log(totalVotes22, totalVotes)
    let data = selectedDataSource === "change" ?
        [{ name: 'KEVIN WALLACE', value: totalVotes['KEVIN WALLACE'] - totalVotes22['KEVIN WALLACE'] },
        { name: 'Other', value: totalVoteCount - totalVoteCount22 - (totalVotes['KEVIN WALLACE'] - totalVotes22['KEVIN WALLACE']) }] :
        Object.keys(totalVotes).map(key => ({
            name: key,
            value: totalVotes[key],
            percentage: ((totalVotes[key] / totalVoteCount) * 100).toFixed(2)
        })).filter(item => item.value > 0);

    console.log(data);

    return (
        <div>
            <h2>Overall Vote Totals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <BarChart width={600} height={300} data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Bar dataKey="value" fill="#8884d8">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
                {(selectedDataSource !== "change") && <div>
                    <PieChart width={600} height={400}>
                        <Pie
                            data={data}
                            // cx={200}
                            // cy={200}
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name, entry) => `${entry.payload.percentage}%`} />
                        <Legend />
                    </PieChart>
                </div>}
            </div>
        </div>
    );
};

export default OverallVoteTotals;
