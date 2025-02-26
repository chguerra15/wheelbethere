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

// Ensure the map is fully loaded before adding data
map.on('load', async () => {
    console.log("Map loaded successfully");

    // Add Boston bike lanes
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

    // Load the Bluebikes station data
    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    let jsonData;

    try {
        jsonData = await d3.json(jsonUrl);
        console.log('Loaded JSON Data:', jsonData);
    } catch (error) {
        console.error('Error loading JSON:', error);
        return;  // Stop execution if data fails to load
    }

    let stations = jsonData.data.stations;
    console.log('Stations Array:', stations);

    // Ensure the map container is styled properly
    const container = d3.select('#map');
    container.style('position', 'relative');

    // Create an SVG overlay to hold the station markers
    const svg = container.append('svg')
        .attr('id', 'station-overlay')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%')
        .style('z-index', '1')
        .style('pointer-events', 'none');  // Prevent blocking map interactions

    // Helper function to convert latitude/longitude to pixel coordinates
    function getCoords(station) {
        const point = map.project([+station.Long, +station.Lat]);
        return { cx: point.x, cy: point.y };
    }

    // Append circles to represent each bike station
    const circles = svg.selectAll('circle')
        .data(stations)
        .enter()
        .append('circle')
        .attr('r', 5)               // Circle radius
        .attr('fill', 'steelblue')  // Circle color
        .attr('stroke', 'white')    // Border color
        .attr('stroke-width', 1)    // Border thickness
        .attr('opacity', 0.8);      // Opacity

    // Function to update marker positions dynamically
    function updatePositions() {
        circles
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    // Update marker positions initially
    updatePositions();

    // Reposition markers on map interactions
    map.on('render', updatePositions);
});
