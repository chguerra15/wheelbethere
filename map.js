import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hndWVycmExNSIsImEiOiJjbTdka3Y4c2swNDg4Mmxwd21sZjk2NDJuIn0.0y_Dn_jn6mgcM65J3VzItg';

// Initialize the Mapbox map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

map.on('load', async () => {
    console.log("Map loaded successfully");

    // Load Boston bike lanes
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
    });

    map.addLayer({
        id: 'bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': 'green',
            'line-width': 3,
            'line-opacity': 0.4
        }
    });

    // Load Bluebikes station data
    const stationUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    let stations;

    try {
        const jsonData = await d3.json(stationUrl);
        stations = jsonData.data.stations.map(s => ({
            ...s,
            lon: parseFloat(s.Long) || parseFloat(s.lon),
            lat: parseFloat(s.Lat) || parseFloat(s.lat)
        })).filter(s => !isNaN(s.lon) && !isNaN(s.lat)); // Remove invalid data

        console.log('Valid Stations:', stations.length);
    } catch (error) {
        console.error('Error loading station data:', error);
        return;
    }

    // Create SVG overlay for markers
    const svg = d3.select('#map').append('svg')
        .attr('id', 'station-overlay')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%')
        .style('z-index', '1')
        .style('pointer-events', 'none');

    // Convert latitude/longitude to pixel coordinates
    function getCoords(station) {
        if (isNaN(station.lon) || isNaN(station.lat)) return { cx: 0, cy: 0 };
        const point = map.project([station.lon, station.lat]);
        return { cx: point.x, cy: point.y };
    }

    // Load trip data
    const tripUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';
    let departuresByMinute = Array.from({ length: 1440 }, () => []);
    let arrivalsByMinute = Array.from({ length: 1440 }, () => []);

    try {
        await d3.csv(tripUrl, (trip) => {
            trip.started_at = new Date(trip.started_at);
            trip.ended_at = new Date(trip.ended_at);
            const startedMinutes = trip.started_at.getHours() * 60 + trip.started_at.getMinutes();
            const endedMinutes = trip.ended_at.getHours() * 60 + trip.ended_at.getMinutes();
            departuresByMinute[startedMinutes].push(trip);
            arrivalsByMinute[endedMinutes].push(trip);
            return trip;
        });
    } catch (error) {
        console.error('Error loading trip data:', error);
        return;
    }

    // Compute traffic for each station
    function computeStationTraffic(stations, timeFilter = -1) {
        const departures = d3.rollup(
            filterByMinute(departuresByMinute, timeFilter),
            v => v.length,
            d => d.start_station_id
        );

        const arrivals = d3.rollup(
            filterByMinute(arrivalsByMinute, timeFilter),
            v => v.length,
            d => d.end_station_id
        );

        return stations.map(station => {
            let id = station.Number;
            station.departures = departures.get(id) || 0;
            station.arrivals = arrivals.get(id) || 0;
            station.totalTraffic = station.departures + station.arrivals || 0;
            return station;
        });
    }

    function filterByMinute(tripsByMinute, minute) {
        if (minute === -1) return tripsByMinute.flat();
        let minMinute = (minute - 60 + 1440) % 1440;
        let maxMinute = (minute + 60) % 1440;
        return (minMinute > maxMinute)
            ? [...tripsByMinute.slice(minMinute), ...tripsByMinute.slice(0, maxMinute)].flat()
            : tripsByMinute.slice(minMinute, maxMinute).flat();
    }

    // Define scales
    let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);
    let radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(stations, d => d.totalTraffic || 0)])
        .range([3, 25]);

    // Add circles for each station
    let circles = svg.selectAll('circle')
        .data(stations, d => d.Number)
        .enter()
        .append('circle')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic || 0));

    // Function to update circle positions
    function updatePositions() {
        circles
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    setTimeout(() => updatePositions(), 1000);

    // Initial position update
    updatePositions();

    // Event listener to update markers dynamically
    map.on('render', updatePositions);

    // Function to update scatter plot
    function updateScatterPlot(timeFilter) {
        const filteredStations = computeStationTraffic(stations, timeFilter);
        radiusScale.range(timeFilter === -1 ? [3, 25] : [5, 50]);

        circles
            .data(filteredStations, d => d.Number)
            .join('circle')
            .attr('r', d => {
                let radius = radiusScale(d.totalTraffic || 0);
                return isNaN(radius) ? 3 : radius;
            })
            .style('--departure-ratio', d => stationFlow(d.departures / d.totalTraffic || 0));
    }

    // Time filter UI elements
    const timeSlider = document.getElementById('time-slider');
    const selectedTime = document.getElementById('selected-time');
    const anyTimeLabel = document.getElementById('any-time');

    function updateTimeDisplay() {
        let timeFilter = Number(timeSlider.value);
        selectedTime.textContent = (timeFilter === -1)
            ? (anyTimeLabel.style.display = 'block', '')
            : (anyTimeLabel.style.display = 'none', new Date(0, 0, 0, 0, timeFilter).toLocaleTimeString('en-US', { timeStyle: 'short' }));
        updateScatterPlot(timeFilter);
    }

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();
});
