import React, { useState, useEffect, useRef } from 'react';
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
  const [voterRegistration, setVoterRegistration] = useState(null); // New state for voter registration data
  const [adjustedVotesData, setAdjustedVotesData] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState('2024');
  const [recoveredVotesPercentage, setRecoveredVotesPercentage] = useState(0); // New state for the slider
  const [threshold, setThreshold] = useState(5); // New state for threshold
  const [availableVotingDates, setAvailableVotingDates] = useState([]); // New state for available voting dates
  const [modalOpen, setModalOpen] = useState(false);
  const [dateSelections, setDateSelections] = useState({});
  const [voterCounts, setVoterCounts] = useState({});



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
    fetchVotesData('/vote-distribution-app/Wallace Voters.xlsx - SH032_vr.csv', setVoterRegistration); // Fetch voter registration data
  }, []);

  const calculateVoterCounts = (voterData) => {
    const counts = {};
    voterData.forEach(voter => {
      for (let i = 1; i <= 10; i++) {
        const date = voter[`VoterHist${i}`];
        if (date) {
          counts[date] = (counts[date] || 0) + 1;
        }
      }
    });
    return counts;
  };

  useEffect(() => {
    if (voterRegistration) {
      const dates = [];
      voterRegistration.forEach(vote => {
        for (let i = 1; i <= 10; i++) {
          const date = vote[`VoterHist${i}`];
          if (date && !dates.includes(date)) {
            dates.push(date);
          }
        }
      });
      setAvailableVotingDates(dates.sort((a, b) => new Date(b) - new Date(a)));

      // Calculate voter counts
      const counts = calculateVoterCounts(voterRegistration);
      setVoterCounts(counts);

    }
  }, [voterRegistration]);

  useEffect(() => {
    if (availableVotingDates.length > 0 && Object.keys(dateSelections).length === 0) {
      const initialSelections = availableVotingDates.reduce((acc, date) => {
        acc[date] = new Date(date) >= new Date('2020-01-01') ? 'include' : 'neutral';
        return acc;
      }, {});
      initialSelections['6/18/2024'] = 'exclude'
      setDateSelections(initialSelections);
    }
  }, [availableVotingDates]);


  const handleDateSelectionChange = (date) => {
    setDateSelections(prev => {
      const newState = { ...prev };
      switch (newState[date]) {
        case 'neutral': newState[date] = 'include'; break;
        case 'include': newState[date] = 'exclude'; break;
        default: newState[date] = 'neutral';
      }
      return newState;
    });
  };

  useEffect(() => {
    if (votesData24) {
      const adjustedData = votesData24.map(vote => {
        const adjustedVotes = {
          'KEVIN WALLACE': +vote['KEVIN WALLACE'] + (+vote['JASON SHILLING'] * (1 - runoffSplit / 100)),
          'JIM SHAW': +vote['JIM SHAW'] + (+vote['JASON SHILLING'] * (runoffSplit / 100)),
        };
        adjustedVotes['KEVIN WALLACE'] += adjustedVotes['JIM SHAW'] * flipPercentage / 100;
        adjustedVotes['JIM SHAW'] *= (1 - flipPercentage / 100);
        adjustedVotes['KEVIN WALLACE'] += (votesData22.find(v => v.Precinct === vote['Precinct'])['KEVIN WALLACE'] - adjustedVotes['KEVIN WALLACE']) * recoveredVotesPercentage / 100;
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

  const DateSelectionModal = ({ isOpen, onClose, availableDates, dateSelections, onDateSelectionChange }) => {
    const modalRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxVoters = Math.max(...Object.values(voterCounts));


    const getCheckboxClass = (state) => {
      switch (state) {
        case 'include': return 'included';
        case 'exclude': return 'excluded';
        default: return 'neutral';
      }
    };

    const getStateLabel = (state) => {
      switch (state) {
        case 'include': return 'Include';
        case 'exclude': return 'Exclude';
        default: return 'Not Filtering';
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal" ref={modalRef}>
          <div className="modal-content">
            <h2>Select Voting Dates</h2>
            <div className="threshold-slider">
              <label>Threshold: {threshold}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
              />
            </div>
            <div className="date-list">
              {availableDates.map(date => (
                <div key={date} className="date-item">
                  <label className={`checkbox-container ${getCheckboxClass(dateSelections[date])}`}>
                    <input
                      type="checkbox"
                      checked={dateSelections[date] === 'include'}
                      onChange={() => onDateSelectionChange(date)}
                    />
                    <span className="checkmark"></span>
                    {date} - {getStateLabel(dateSelections[date])}
                  </label>
                  <div className="voter-info">
                    <span>{voterCounts[date]} voters</span>
                    <div className="voter-bar" style={{ width: `${(voterCounts[date] / maxVoters) * 50}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  const getDataSource = () => {
    switch (selectedDataSource) {
      case '2022':
        return votesData22;
      case '2024':
        return votesData24;
      case 'adjusted':
        return adjustedVotesData;
      case 'previousTotalVotes':
        return filterVotesByDates(voterRegistration, dateSelections, threshold);
      default:
        return votesData24;
    }
  };
  const filterVotesByDates = (votesData, dateSelections, threshold) => {

    const includeDates = Object.entries(dateSelections)
      .filter(([_, state]) => state === 'include')
      .map(([date, _]) => date);

    const excludeDates = Object.entries(dateSelections)
      .filter(([_, state]) => state === 'exclude')
      .map(([date, _]) => date);

    if (includeDates.length === 0 && excludeDates.length === 0) return votesData;

    const filteredVoters = votesData.filter(vote => {
      const voterDates = new Set(Array.from({ length: 10 }, (_, i) => vote[`VoterHist${i + 1}`]));

      // Check if voter participated in any excluded dates
      const votedInExcludedDate = excludeDates.some(date => voterDates.has(date));
      if (votedInExcludedDate) return false;

      // Check if voter meets the threshold for included dates
      const votedIncludedCount = includeDates.filter(date => voterDates.has(date)).length;
      return votedIncludedCount >= threshold;
    });

    const precinctTotals = filteredVoters.reduce((acc, vote) => {
      const precinct = vote['Precinct'];
      acc[precinct] = (acc[precinct] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(precinctTotals).map(([Precinct, TotalVoters]) => ({ Precinct, TotalVoters }));
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
          <option value="previousTotalVotes">Previous Total Votes</option>
        </select>
      </div>
      {selectedDataSource === 'previousTotalVotes' && (
        <div className="date-selection">
          <button onClick={() => setModalOpen(true)}>Select Voting Dates</button>
        </div>
      )}
      <DateSelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        availableDates={availableVotingDates}
        dateSelections={dateSelections}
        onDateSelectionChange={handleDateSelectionChange}
        threshold={threshold}
        setThreshold={setThreshold}
        voterCounts={voterCounts}
      />
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
