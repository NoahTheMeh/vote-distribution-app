import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, GeoJSON, Popup } from 'react-leaflet';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.minichart';

const COLORS = ['#FF0000', '#0000FF', '#00FF00', '#FFA500', '#800080', '#FFFF00'];

const Map = ({ votesData }) => {
    const [precinctsData, setPrecinctsData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const precinctsResponse = await fetch('/HD_32_Precincts.geojson');
            const precinctsJson = await precinctsResponse.json();
            setPrecinctsData(precinctsJson);
        };

        fetchData();
    }, []);

    return (
        <MapContainer
            center={[35.7, -97.5]}
            zoom={10}
            style={{ height: '800px', width: '100%' }}
            zoomControl={false} // Disable zoom controls
            scrollWheelZoom={false} // Disable zoom by scroll wheel
            doubleClickZoom={false} // Disable zoom by double click
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {precinctsData && <GeoJSONOutline precinctsData={precinctsData} />}
            {precinctsData && votesData && (
                <PieChartLayer
                    precinctsData={precinctsData}
                    votesData={votesData}
                />
            )}
        </MapContainer>
    );
};

const GeoJSONOutline = ({ precinctsData }) => {
    return <GeoJSON data={precinctsData} style={{ color: 'black', weight: 2 }} />;
};

const PieChartLayer = ({ precinctsData, votesData }) => {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (layerRef.current) {
            layerRef.current.clearLayers();
        } else {
            layerRef.current = L.layerGroup().addTo(map);
        }

        precinctsData.features.forEach((precinct) => {
            const vote = votesData.find(v => v.Precinct === precinct.properties.PCT_CEB);
            if (vote) {
                const centroid = d3.geoCentroid(precinct);
                const voteFields = Object.keys(vote).filter(key => key !== 'Precinct');
                const totalVotes = voteFields.reduce((sum, field) => sum + (+vote[field]), 0);
                const sizes = voteFields.map(field => +vote[field]);

                // Calculate the radius based on total votes
                const baseRadius = 0.15; // Adjust as necessary
                const radius = baseRadius * totalVotes;

                const pieChart = L.minichart([centroid[1], centroid[0]], {
                    type: 'pie',
                    data: sizes,
                    width: radius,
                    colors: COLORS.slice(0, sizes.length) // Use the predefined COLORS
                });

                pieChart.on('mouseover', function () {
                    const popupContent = voteFields.map(field => `${field}: ${Math.floor(vote[field])}`).join('<br>');
                    L.popup()
                        .setLatLng([centroid[1], centroid[0]])
                        .setContent(popupContent)
                        .openOn(map);
                });

                pieChart.on('mouseout', function () {
                    map.closePopup();
                });

                layerRef.current.addLayer(pieChart);
            }
        });

        // Clean up on unmount
        return () => {
            if (layerRef.current) {
                layerRef.current.clearLayers();
            }
        };
    }, [map, precinctsData, votesData]);

    return null;
};

export default Map;
