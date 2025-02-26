import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
console.log("Mapbox GL JS Loaded:", mapboxgl);

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hndWVycmExNSIsImEiOiJjbTdka3Y4c2swNDg4Mmxwd21sZjk2NDJuIn0.0y_Dn_jn6mgcM65J3VzItg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will render
    style: 'mapbox://styles/mapbox/streets-v12', // Map style
    center: [-71.09415, 42.36027], // [longitude, latitude]
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18 // Maximum allowed zoom
});

map.on('load', async () => {
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

    let jsonData;
    try {
        const jsonurl = INPUT_BLUEBIKES_CSV_URL;
        
        // Await JSON fetch
        jsonData = await d3.json(jsonurl);
        
        console.log('Loaded JSON Data:', jsonData); // Log to verify structure
    } catch (error) {
        console.error('Error loading JSON:', error); // Handle errors
    }

    // Append circles to the SVG for each station
    const svg = d3.select('#map').select('svg');
    const stations = jsonData.data.stations;
    console.log('Stations Array:', stations);

    const circles = svg.selectAll('circle')
        .data(stations)
        .enter()
        .append('circle')
        .attr('r', 5)               // Radius of the circle
        .attr('fill', 'steelblue')  // Circle fill color
        .attr('stroke', 'white')    // Circle border color
        .attr('stroke-width', 1)    // Circle border thickness
        .attr('opacity', 0.8);      // Circle opacity

    function getCoords(station) {
        const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
        const { x, y } = map.project(point);  // Project to pixel coordinates
        return { cx: x, cy: y };  // Return as object for use in SVG attributes
    }

    // Function to update circle positions when the map moves/zooms
    function updatePositions() {
        circles
            .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
            .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
    }

    // Initial position update when map loads
    updatePositions();

    // Reposition markers on map interactions
    map.on('move', updatePositions);     // Update during map movement
    map.on('zoom', updatePositions);     // Update during zooming
    map.on('resize', updatePositions);   // Update on window resize
    map.on('moveend', updatePositions);  // Final adjustment after movement ends
});
