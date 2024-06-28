import React, { useState, useEffect } from 'react';
import Map from './Map';
import MapView from './MapView';
import Slider from './components/Slider';
import OverallVoteTotals from './OverallVoteTotals'; // Adjust the path if necessary
import * as d3 from 'd3';

const App = () => {
    const [runoffSplit, setRunoffSplit] = useState(0.8);
    const [flipPercentage, setFlipPercentage] = useState(0.1);
    const [votesData2024, setVotesData2024] = useState(null);
    const [votesData2022, setVotesData2022] = useState(null);
    const [adjustedVotesData, setAdjustedVotesData] = useState(null);
    const [isAdjustmentOn, setIsAdjustmentOn] = useState(true);
    const [oldVoterPercentage, setOldVoterPercentage] = useState(0);

    useEffect(() => {
        const fetchVotesData = async () => {
            const votesResponse2024 = await fetch('/PrimaryResults_2024.csv');
            const votesText2024 = await votesResponse2024.text();
            const votesCsv2024 = d3.csvParse(votesText2024);

            const votesResponse2022 = await fetch('/PrimaryResults_2022.csv');
            const votesText2022 = await votesResponse2022.text();
            const votesCsv2022 = d3.csvParse(votesText2022);

            setVotesData2024(votesCsv2024);
            setVotesData2022(votesCsv2022);
        };

        fetchVotesData();
    }, []);

    useEffect(() => {
        if (votesData2024 && votesData2022) {
            const adjustedData = votesData2024.map(vote2024 => {
                const vote2022 = votesData2022.find(v => v.Precinct === vote2024.Precinct);
                const oldVoterContribution = vote2022 ? (oldVoterPercentage * vote2022['KEVIN WALLACE']) / 100 : 0;
                const newKevinWallaceVotes = +vote2024['KEVIN WALLACE'] + oldVoterContribution;

                if (isAdjustmentOn) {
                    const adjustedVotes = {
                        'KEVIN WALLACE': newKevinWallaceVotes + (+vote2024['JASON SHILLING'] * runoffSplit),
                        'JIM SHAW': +vote2024['JIM SHAW'] + (+vote2024['JASON SHILLING'] * (1 - runoffSplit)),
                    };
                    adjustedVotes['KEVIN WALLACE'] += adjustedVotes['JIM SHAW'] * flipPercentage;
                    adjustedVotes['JIM SHAW'] *= (1 - flipPercentage);
                    return {
                        ...vote2024,
                        'KEVIN WALLACE': adjustedVotes['KEVIN WALLACE'],
                        'JIM SHAW': adjustedVotes['JIM SHAW'],
                        'JASON SHILLING': 0, // Since JASON SHILLING's votes are redistributed
                    };
                } else {
                    return vote2024;
                }
            });
            setAdjustedVotesData(adjustedData);
        }
    }, [votesData2024, votesData2022, runoffSplit, flipPercentage, isAdjustmentOn, oldVoterPercentage]);

    return (
        <div>
            <h1>Vote Distribution</h1>
            <Map runoffSplit={runoffSplit} flipPercentage={flipPercentage} adjustedVotesData={adjustedVotesData} />
            <div>
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    initialValue={runoffSplit}
                    onChange={setRunoffSplit}
                    label={'Runoff Split'}
                />
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    initialValue={flipPercentage}
                    onChange={setFlipPercentage}
                    label={'Flip Percentage'}
                />
                <Slider
                    min={0}
                    max={100}
                    step={1}
                    initialValue={oldVoterPercentage}
                    onChange={setOldVoterPercentage}
                    label={'Old Voter Percentage'}
                />
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={isAdjustmentOn}
                            onChange={() => setIsAdjustmentOn(!isAdjustmentOn)}
                        />
                        Adjust Votes
                    </label>
                </div>
            </div>
            {adjustedVotesData && <OverallVoteTotals votesData={adjustedVotesData} />}
            {votesData2024 && votesData2022 && (
                <MapView votesData2024={votesData2024} votesData2022={votesData2022} />
            )}
        </div>
    );
};

export default App;
