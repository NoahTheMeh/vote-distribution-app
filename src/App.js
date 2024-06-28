import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Slider from './components/Slider';
import OverallVoteTotals from './components/OverallVoteTotals'; // Adjust the path if necessary
import * as d3 from 'd3';

const App = () => {
  const [runoffSplit, setRunoffSplit] = useState(80);
  const [flipPercentage, setFlipPercentage] = useState(10);
  const [votesData22, setVotesData22] = useState(null);
  const [votesData24, setVotesData24] = useState(null);
  const [adjustedVotesData, setAdjustedVotesData] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState('2024');

  useEffect(() => {
    const fetchVotesData = async (path, setVotesData) => {
      const votesResponse = await fetch(path);
      const votesText = await votesResponse.text();
      const votesCsv = d3.csvParse(votesText);
      setVotesData(votesCsv);
      console.log('Vote Loaded', votesCsv);
    };

    fetchVotesData('/PrimaryResults_2022.csv', setVotesData22);
    fetchVotesData('/PrimaryResults_2024.csv', setVotesData24);
  }, []);

  useEffect(() => {
    if (votesData24) {
      const adjustedData = votesData24.map(vote => {
        const adjustedVotes = {
          'KEVIN WALLACE': +vote['KEVIN WALLACE'] + (+vote['JASON SHILLING'] * (1 - runoffSplit / 100)),
          'JIM SHAW': +vote['JIM SHAW'] + (+vote['JASON SHILLING'] * (runoffSplit / 100)),
        };
        adjustedVotes['KEVIN WALLACE'] += adjustedVotes['JIM SHAW'] * flipPercentage / 100;
        adjustedVotes['JIM SHAW'] *= (1 - flipPercentage / 100);
        return {
          'Precinct': vote['Precinct'],
          'KEVIN WALLACE': adjustedVotes['KEVIN WALLACE'],
          'JIM SHAW': adjustedVotes['JIM SHAW'],
        };
      });
      setAdjustedVotesData(adjustedData);
    }
  }, [votesData24, runoffSplit, flipPercentage]);

  const handleDataSourceChange = (event) => {
    setSelectedDataSource(event.target.value);
  };

  const getDataSource = () => {
    switch (selectedDataSource) {
      case '2022':
        console.log(votesData22);
        return votesData22;
      case '2024':
        console.log('Voters', votesData24);
        return votesData24;
      case 'adjusted':
        return adjustedVotesData;
      default:
        return votesData24;
    }
  };

  return (
    <div>
      <h1>Vote Distribution</h1>
      <div>
        <label htmlFor="dataSource">Select Data Source: </label>
        <select id="dataSource" onChange={handleDataSourceChange}>
          <option value="2022">2022</option>
          <option value="2024">2024</option>
          <option value="adjusted">Adjusted</option>
        </select>
      </div>
      <Map votesData={getDataSource()} />
      <div>
        <Slider
          min={0}
          max={100}
          step={1}
          initialValue={runoffSplit}
          onChange={setRunoffSplit}
          label={'Percentage of Shilling vote going to Shaw'}
        />
        <Slider
          min={0}
          max={100}
          step={1}
          initialValue={flipPercentage}
          onChange={setFlipPercentage}
          label={'Percentage of Shaw vote flipping to Wallace'}
        />
      </div>
      {<OverallVoteTotals votesData={getDataSource()} />}
    </div>
  );
};

export default App;
