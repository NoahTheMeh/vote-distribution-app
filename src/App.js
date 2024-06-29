import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Slider from './components/Slider';
import OverallVoteTotals from './components/OverallVoteTotals';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';
import './App.css'; // Import the CSS file

const App = () => {
  const [runoffSplit, setRunoffSplit] = useState(80);
  const [flipPercentage, setFlipPercentage] = useState(10);
  const [votesData22, setVotesData22] = useState(null);
  const [votesData24, setVotesData24] = useState(null);
  const [adjustedVotesData, setAdjustedVotesData] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState('2024');
  const [recoveredVotesPercentage, setRecoveredVotesPercentage] = useState(0); // New state for the slider
  const COLORS = ['#DD2B25', '#2BA9D6', '#DABE78', '#FFBF7F', '#BF7FBF', '#FFFF7F'];

  useEffect(() => {
    const fetchVotesData = async (path, setVotesData) => {
      try {
        let votesResponse = await fetch(path);
        let votesText = await votesResponse.text();
        let votesCsv = d3.csvParse(votesText);
        setVotesData(votesCsv);
      } catch (error) {
        console.error('Error loading votes data:', error);
      }
    };

    fetchVotesData('/vote-distribution-app/PrimaryResults_2022.csv', setVotesData22);
    fetchVotesData('/vote-distribution-app/PrimaryResults_2024.csv', setVotesData24);
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
        console.log(adjustedVotes['KEVIN WALLACE'])
        adjustedVotes['KEVIN WALLACE'] += (votesData22.find(v => v.Precinct === vote['Precinct'])['KEVIN WALLACE'] - adjustedVotes['KEVIN WALLACE']) * recoveredVotesPercentage / 100;
        console.log(adjustedVotes['KEVIN WALLACE'])
        return {
          'Precinct': vote['Precinct'],
          'KEVIN WALLACE': adjustedVotes['KEVIN WALLACE'],
          'JIM SHAW': adjustedVotes['JIM SHAW'],
        };
      });
      setAdjustedVotesData(adjustedData);
    }
  }, [votesData24, runoffSplit, flipPercentage, recoveredVotesPercentage]);

  const handleDataSourceChange = (event) => {
    setSelectedDataSource(event.target.value);
  };

  const getDataSource = () => {
    switch (selectedDataSource) {
      case '2022':
        return votesData22;
      case '2024':
        return votesData24;
      case 'adjusted':
        return adjustedVotesData;
      default:
        return votesData24;
    }
  };

  return (
    <div className="app">
      <h1>Vote Distribution</h1>
      <div className="data-source-selector">
        <label htmlFor="dataSource">Select Data Source: </label>
        <select id="dataSource" onChange={handleDataSourceChange}>
          <option value="2022">2022</option>
          <option value="2024" selected="selected">2024</option>
          <option value="adjusted">Runoff</option>
          <option value="change">2022-2024 Change</option>
        </select>
      </div>
      <div className="content">
        <div className="map-container">
          <Map
            votesData={getDataSource()}
            colors={COLORS}
            votesData22={votesData22}
            showChange={selectedDataSource === 'change'}
          />
          {selectedDataSource === 'adjusted' && (
            <div className="slider-popup">
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
              <Slider
                min={0}
                max={100}
                step={1}
                initialValue={recoveredVotesPercentage}
                onChange={setRecoveredVotesPercentage}
                label={'Percentage of votes to recover from 2022'}
              />
            </div>
          )}
        </div>
        <div className="charts-container">
          <OverallVoteTotals votesData={getDataSource()} colors={COLORS} selectedDataSource={selectedDataSource} votesData22={votesData22} />
        </div>
      </div>
    </div>
  );
};

export default App;
