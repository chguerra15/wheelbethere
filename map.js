import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

document.addEventListener("DOMContentLoaded", function() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hndWVycmExNSIsImEiOiJjbTdka3Y4c2swNDg4Mmxwd21sZjk2NDJuIn0.0y_Dn_jn6mgcM65J3VzItg';

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-71.09415, 42.36027],
      zoom: 12,
      minZoom: 5,
      maxZoom: 18
    });

    map.on('load', async () => {
        // Load Bike Lanes (Existing Code)
        map.addSource('boston_route', {
            type: 'geojson',
            data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
        });

        map.addLayer({
            id: 'bike-lanes-boston',
            type: 'line',
            source: 'boston_route',
            paint: {
                'line-color': '#32D400',
                'line-width': 3,
                'line-opacity': 0.7
            }
        });

        // Step 3.1: Fetching and Parsing Bluebikes Station Data
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

        // Step 3.2: Overlaying SVG on the Map
        const container = d3.select('#map');
        container.style('position', 'relative');  // Ensure correct positioning

        const svg = container.append('svg')
            .attr('id', 'station-overlay')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('z-index', '1')
            .style('pointer-events', 'none');

        // Step 3.3: Helper Function to Convert Coordinates
        function getCoords(station) {
            const point = map.project([+station.Long, +station.Lat]);
            return { cx: point.x, cy: point.y };
        }

        // Step 3.3: Adding Station Markers
        const circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 5)  // Radius of the circle
            .attr('fill', 'steelblue')  // Circle fill color
            .attr('stroke', 'white')  // Circle border color
            .attr('stroke-width', 1)  // Circle border thickness
            .attr('opacity', 0.8);  // Circle opacity

        // Step 3.3: Update Circle Positions
        function updatePositions() {
            circles
                .attr('cx', d => getCoords(d).cx)
                .attr('cy', d => getCoords(d).cy);
        }

        // Initial Position Update
        updatePositions();

        // Step 3.3: Add Event Listeners to Update Positions
        map.on('render', updatePositions);
    });
});