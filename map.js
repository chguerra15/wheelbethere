document.addEventListener("DOMContentLoaded", function() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hndWVycmExNSIsImEiOiJjbTdka3Y4c2swNDg4Mmxwd21sZjk2NDJuIn0.0y_Dn_jn6mgcM65J3VzItg';
  
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-71.09415, 42.36027], // Centered around Boston
      zoom: 12,
      minZoom: 5,
      maxZoom: 18
    });
  
    map.on('load', () => {
      console.log('Map loaded!');
  
      // ✅ Add Bike Lanes (Boston & Cambridge)
      map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
      });
  
      map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://opendata.arcgis.com/datasets/cambridge::bike-lanes.geojson'
      });
  
      map.addLayer({
        id: 'bike-lanes-boston',
        type: 'line',
        source: 'boston_route',
        paint: {
          'line-color': '#32D400',
          'line-width': 4,
          'line-opacity': 0.6
        }
      });
  
      map.addLayer({
        id: 'bike-lanes-cambridge',
        type: 'line',
        source: 'cambridge_route',
        paint: {
          'line-color': '#0088FF',
          'line-width': 4,
          'line-opacity': 0.6
        }
      });
  
      console.log('Bike lanes added to map!');
  
      // ✅ Step 3.1: Load Bluebikes Station Data
      d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json')
        .then(jsonData => {
          console.log('Loaded JSON Data:', jsonData);
  
          // Extract station info
          let stations = jsonData.data.stations;
          console.log('Stations Array:', stations);
  
          // ✅ Step 3.2: Overlay an SVG for Bluebikes Stations
          const svg = d3.select('#map')
            .append('svg')
            .attr('id', 'station-overlay')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('z-index', '1') // Ensures it appears on top
            .style('pointer-events', 'none'); // Allows map interaction
  
          // ✅ Step 3.3: Helper Function to Convert Coordinates
          function getCoords(station) {
            const point = new mapboxgl.LngLat(+station.Long, +station.Lat); // Convert to Mapbox format
            const { x, y } = map.project(point); // Project to pixel coordinates
            return { cx: x, cy: y };
          }
  
          // ✅ Step 3.3: Append Station Markers as Circles
          const circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 5) // Station marker size
            .attr('fill', 'red') // Marker color
            .attr('stroke', 'white') // White border
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .on('mouseover', function(event, d) {
              d3.select(this).attr('r', 8);
            })
            .on('mouseout', function(event, d) {
              d3.select(this).attr('r', 5);
            });
  
          // ✅ Step 3.3: Function to Update Positions
          function updatePositions() {
            circles
              .attr('cx', d => getCoords(d).cx) // Convert longitude to x-pixel coordinate
              .attr('cy', d => getCoords(d).cy); // Convert latitude to y-pixel coordinate
          }
  
          // ✅ Initial Positioning
          updatePositions();
  
          // ✅ Keep Station Markers Aligned When Map Moves
          map.on('move', updatePositions);
          map.on('zoom', updatePositions);
          map.on('resize', updatePositions);
          map.on('moveend', updatePositions);
  
          console.log('Station markers added!');
        })
        .catch(error => {
          console.error('Error loading JSON:', error);
        });
    });
  });
  