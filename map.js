import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hndWVycmExNSIsImEiOiJjbTdka3Y4c2swNDg4Mmxwd21sZjk2NDJuIn0.0y_Dn_jn6mgcM65J3VzItg';

// Initialize the Mapbox map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027],  // [longitude, latitude]
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
        stations = jsonData.data.stations;
        console.log('Stations Array:', stations);
    } catch (error) {
        console.error('Error loading JSON:', error);
        return;
    }

    // Create SVG overlay for station markers
    const container = d3.select('#map');
    const svg = container.append('svg')
        .attr('id', 'station-overlay')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%')
        .style('z-index', '1')
        .style('pointer-events', 'none');

    // Helper function to convert latitude/longitude to pixel coordinates
    function getCoords(station) {
        const point = map.project([+station.Long, +station.Lat]);
        return { cx: point.x, cy: point.y };
    }

    // Load trip data and preprocess
    const tripUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';
    let trips;
    let departuresByMinute = Array.from({ length: 1440 }, () => []);
    let arrivalsByMinute = Array.from({ length: 1440 }, () => []);

    try {
        trips = await d3.csv(tripUrl, (trip) => {
            trip.started_at = new Date(trip.started_at);
            trip.ended_at = new Date(trip.ended_at);
            const startedMinutes = trip.started_at.getHours() * 60 + trip.started_at.getMinutes();
            const endedMinutes = trip.ended_at.getHours() * 60 + trip.ended_at.getMinutes();
            departuresByMinute[startedMinutes].push(trip);
            arrivalsByMinute[endedMinutes].push(trip);
            return trip;
        });
    } catch (error) {
        console.error('Error loading trips:', error);
        return;
    }

    // Function to compute traffic at each station
    function computeStationTraffic(stations, timeFilter = -1) {
        const departures = d3.rollup(
            filterByMinute(departuresByMinute, timeFilter),
            (v) => v.length,
            (d) => d.start_station_id
        );
        const arrivals = d3.rollup(
            filterByMinute(arrivalsByMinute, timeFilter),
            (v) => v.length,
            (d) => d.end_station_id
        );

        return stations.map((station) => {
            let id = station.Number;
            station.arrivals = arrivals.get(id) ?? 0;
            station.departures = departures.get(id) ?? 0;
            station.totalTraffic = station.arrivals + station.departures;
            return station;
        });
    }

    function filterByMinute(tripsByMinute, minute) {
        if (minute === -1) return tripsByMinute.flat();

        let minMinute = (minute - 60 + 1440) % 1440;
        let maxMinute = (minute + 60) % 1440;

        if (minMinute > maxMinute) {
            return [...tripsByMinute.slice(minMinute), ...tripsByMinute.slice(0, maxMinute)].flat();
        } else {
            return tripsByMinute.slice(minMinute, maxMinute).flat();
        }
    }

    // Define color scale
    let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);

    // Define size scale
    let radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(stations, (d) => d.totalTraffic)])
        .range([0, 25]);

    // Append circles for each station
    let circles = svg.selectAll('circle')
        .data(stations, (d) => d.Number)
        .enter()
        .append('circle')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .style("--departure-ratio", (d) => stationFlow(d.departures / d.totalTraffic));

    // Function to update circle positions dynamically
    function updatePositions() {
        circles
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    // Initial position update
    updatePositions();

    // Add event listeners for dynamic updates
    map.on('render', updatePositions);

    // Function to update scatter plot
    function updateScatterPlot(timeFilter) {
        const filteredStations = computeStationTraffic(stations, timeFilter);

        timeFilter === -1 ? radiusScale.range([0, 25]) : radiusScale.range([3, 50]);

        circles
            .data(filteredStations, (d) => d.Number)
            .join('circle')
            .attr('r', (d) => radiusScale(d.totalTraffic))
            .style('--departure-ratio', (d) => stationFlow(d.departures / d.totalTraffic));
    }

    // Link the slider for interactive filtering
    const timeSlider = document.getElementById('time-slider');
    const selectedTime = document.getElementById('selected-time');
    const anyTimeLabel = document.getElementById('any-time');

    function updateTimeDisplay() {
        let timeFilter = Number(timeSlider.value);

        if (timeFilter === -1) {
            selectedTime.textContent = '';
            anyTimeLabel.style.display = 'block';
        } else {
            selectedTime.textContent = new Date(0, 0, 0, 0, timeFilter).toLocaleTimeString('en-US', { timeStyle: 'short' });
            anyTimeLabel.style.display = 'none';
        }

        updateScatterPlot(timeFilter);
    }

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();
});
