import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, GeoJSON } from 'react-leaflet';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const Map = ({ votesData, colors, votesData22, showChange }) => {
    const [precinctsData, setPrecinctsData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const precinctsResponse = await fetch('/vote-distribution-app/HD_32_Precincts.geojson');
            const precinctsJson = await precinctsResponse.json();
            setPrecinctsData(precinctsJson);
        };

        fetchData();
    }, []);

    return (
        <MapContainer
            center={[35.7, -96.9]}
            zoom={10}
            minZoom={10}
            style={{ height: '50vh', width: '40vw' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {precinctsData && <GeoJSONOutline precinctsData={precinctsData} />}
            {precinctsData && votesData && !showChange && (
                <PieChartLayer
                    precinctsData={precinctsData}
                    votesData={votesData}
                    colors={colors}
                />
            )}
            {precinctsData && votesData && votesData22 && showChange && (
                <ChangeLayer
                    precinctsData={precinctsData}
                    votesData={votesData}
                    votesData22={votesData22}
                />
            )}
        </MapContainer>
    );
};

const GeoJSONOutline = ({ precinctsData }) => {
    return <GeoJSON data={precinctsData} style={{ color: 'black', weight: 2, fillColor: 'white' }} />;
};

const PieChartLayer = ({ precinctsData, votesData, colors }) => {
    const map = useMap();
    const svgRef = useRef(null);

    const updateCharts = () => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous layers

        const bounds = map.getBounds();
        const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
        const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

        svg.style('width', `${bottomRight.x - topLeft.x}px`)
            .style('height', `${bottomRight.y - topLeft.y}px`)
            .style('left', `${topLeft.x}px`)
            .style('top', `${topLeft.y}px`);

        const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

        precinctsData.features.forEach((precinct) => {
            const vote = votesData.find(v => v.Precinct === precinct.properties.PCT_CEB);
            if (vote) {
                const centroid = d3.geoCentroid(precinct);
                const projectedCentroid = map.latLngToLayerPoint(new L.LatLng(centroid[1], centroid[0]));
                const voteFields = Object.keys(vote).filter(key => key !== 'Precinct');
                const totalVotes = voteFields.reduce((sum, field) => sum + (+vote[field]), 0);
                const sizes = voteFields.map(field => +vote[field]);

                const zoom = map.getZoom();
                const baseRadius = 1500;
                const radius = baseRadius * totalVotes / 1000 * Math.pow(2, zoom - 15);

                const arc = d3.arc()
                    .outerRadius(radius)
                    .innerRadius(0);

                const pie = d3.pie();

                const chart = g.append('g')
                    .attr('transform', `translate(${projectedCentroid.x - topLeft.x},${projectedCentroid.y - topLeft.y})`);

                pie(sizes).forEach((d, i) => {
                    chart.append('path')
                        .attr('d', arc(d))
                        .attr('fill', colors[i])
                        .attr('class', 'leaflet-interactive')
                        .attr('data-centroid', JSON.stringify(centroid))
                        .attr('data-vote', JSON.stringify(vote))
                        .attr('data-votefields', JSON.stringify(voteFields))
                        .on('mouseenter', handleMouseEnter)
                        .on('mouseleave', handleMouseLeave);
                });
            }
        });
    };

    const handleMouseEnter = (event) => {

        const target = event.target;
        const centroid = JSON.parse(target.getAttribute('data-centroid'));
        const vote = JSON.parse(target.getAttribute('data-vote'));
        const voteFields = JSON.parse(target.getAttribute('data-votefields'));

        const popupContent = voteFields.map(field => `${field}: ${Math.floor(vote[field])}`).join('<br>');
        L.popup()
            .setLatLng([centroid[1], centroid[0]])
            .setContent(popupContent)
            .openOn(map);
    };

    const handleMouseLeave = () => {
        map.closePopup();
    };

    useEffect(() => {
        if (!svgRef.current) {
            const svg = d3.select(map.getPanes().overlayPane).append('svg');
            svgRef.current = svg.node();
        }

        updateCharts();

        map.on('zoomend moveend', updateCharts);

        return () => {
            map.off('zoomend moveend', updateCharts);
            if (svgRef.current) {
                d3.select(svgRef.current).remove();
                svgRef.current = null;
            }
        };
    }, [map, precinctsData, votesData]);

    return null;
};

const ChangeLayer = ({ precinctsData, votesData, votesData22, }) => {
    const map = useMap();
    const svgRef = useRef(null);

    const updateCharts = () => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous layers

        const bounds = map.getBounds();
        const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
        const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

        svg.style('width', `${bottomRight.x - topLeft.x}px`)
            .style('height', `${bottomRight.y - topLeft.y}px`)
            .style('left', `${topLeft.x}px`)
            .style('top', `${topLeft.y}px`);

        const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

        precinctsData.features.forEach((precinct) => {
            const vote2022 = votesData22.find(v => v.Precinct === precinct.properties.PCT_CEB);
            const vote2024 = votesData.find(v => v.Precinct === precinct.properties.PCT_CEB);

            if (vote2022 && vote2024) {
                const centroid = d3.geoCentroid(precinct);
                const projectedCentroid = map.latLngToLayerPoint(new L.LatLng(centroid[1], centroid[0]));
                const totalVotes2022 = +vote2022['KEVIN WALLACE'];
                const totalVotes2024 = +vote2024['KEVIN WALLACE'];
                const voteDifference = totalVotes2024 - totalVotes2022;

                const zoom = map.getZoom();
                const baseSize = 1500;
                const size = baseSize * Math.abs(voteDifference) / 10 * Math.pow(2, zoom - 15);

                const arrowColor = voteDifference > 0 ? 'green' : 'red';

                g.append('svg:path')
                    .attr('d', d3.symbol().type(d3.symbolTriangle).size(size))
                    .attr('transform', `translate(${projectedCentroid.x - topLeft.x},${projectedCentroid.y - topLeft.y}) rotate(${voteDifference > 0 ? 0 : 180})`)
                    .attr('fill', arrowColor)
                    .attr('class', 'leaflet-interactive')
                    .attr('data-centroid', JSON.stringify(centroid))
                    .attr('data-vote2022', JSON.stringify(vote2022))
                    .attr('data-vote2024', JSON.stringify(vote2024))
                    .on('mouseenter', handleMouseEnter)
                    .on('mouseleave', handleMouseLeave);
            }
        });
    };

    const handleMouseEnter = (event) => {
        const target = event.target;
        const centroid = JSON.parse(target.getAttribute('data-centroid'));
        const vote2022 = JSON.parse(target.getAttribute('data-vote2022'));
        const vote2024 = JSON.parse(target.getAttribute('data-vote2024'));

        const popupContent = `
      <table>
        <tr><th>2022</th><td></td><th>2024</th></tr>
        <tr><td>Kevin Wallace</td><td>${vote2022['KEVIN WALLACE']}</td><td>Kevin Wallace</td><td>${vote2024['KEVIN WALLACE']}</td></tr>
        <tr><td>Ryan Dixon</td><td>${vote2022['RYAN DIXON']}</td><td>Jim Shaw</td><td>${vote2024['JIM SHAW']}</td></tr>
        <tr><td></td><td></td><td>Jason Shilling</td><td>${vote2024['JASON SHILLING']}</td></tr>
      </table>
    `;
        L.popup()
            .setLatLng([centroid[1], centroid[0]])
            .setContent(popupContent)
            .openOn(map);
    };

    const handleMouseLeave = () => {
        map.closePopup();
    };

    useEffect(() => {
        if (!svgRef.current) {
            const svg = d3.select(map.getPanes().overlayPane).append('svg');
            svgRef.current = svg.node();
        }

        updateCharts();

        map.on('zoomend moveend', updateCharts);

        return () => {
            map.off('zoomend moveend', updateCharts);
            if (svgRef.current) {
                d3.select(svgRef.current).remove();
                svgRef.current = null;
            }
        };
    }, [map, precinctsData, votesData, votesData22]);

    return null;
};

export default Map;
