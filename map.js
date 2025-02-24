document.addEventListener("DOMContentLoaded", function () {
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
        try {
            // Add Boston Bike Lanes Layer
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

            // Fetch bike station data
            const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
            const jsonData = await d3.json(jsonurl);
            console.log('Loaded JSON Data:', jsonData);

            const stations = jsonData.data.stations.filter(station =>
                station.Lat && station.Long && !isNaN(station.Lat) && !isNaN(station.Long)
            );

            // Select or create the SVG overlay
            const svg = d3.select("#map")
                .append("svg")
                .attr("id", "station-overlay")
                .style("position", "absolute")
                .style("top", "0")
                .style("left", "0")
                .style("width", "100%")
                .style("height", "100%")
                .style("pointer-events", "none");

            function getCoords(station) {
                const point = new mapboxgl.LngLat(+station.Long, +station.Lat);
                const { x, y } = map.project(point);
                return { cx: x, cy: y };
            }

            // Append circles for each bike station
            const circles = svg.selectAll("circle")
                .data(stations)
                .enter()
                .append("circle")
                .attr("r", 5) // Adjust the radius to match the screenshot
                .attr("fill", "steelblue")
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .attr("opacity", 0.9);

            function updatePositions() {
                circles
                    .attr("cx", d => getCoords(d).cx)
                    .attr("cy", d => getCoords(d).cy);
            }

            // Initial update
            updatePositions();

            // Keep the circles aligned with the map when panning/zooming
            map.on("move", updatePositions);
            map.on("zoom", updatePositions);
            map.on("resize", updatePositions);
            map.on("moveend", updatePositions);
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    });
});
