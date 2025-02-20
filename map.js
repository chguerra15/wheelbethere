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
  
      // ✅ Add Boston Bike Lanes (Cambridge source removed)
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
  
      console.log('Bike lanes added to map!');
  
      // ✅ Load Bluebikes Station Data
      d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json')
        .then(jsonData => {
          if (!jsonData.data || !jsonData.data.stations) {
            console.error('Invalid JSON structure:', jsonData);
            return;
          }
  
          // ✅ Filter out stations with missing coordinates
          const stations = jsonData.data.stations.filter(station =>
            station.Lat && station.Long && !isNaN(station.Lat) && !isNaN(station.Long)
          );
  
          console.log('Valid Stations Loaded:', stations.length);
  
          // ✅ Create the SVG overlay
          const svg = d3.select('#map')
            .append('svg')
            .attr('id', 'station-overlay')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('z-index', '1')
            .style('pointer-events', 'none');
  
          // ✅ Convert Station Coordinates to Pixel Positions
          function getCoords(station) {
            if (!station.Long || !station.Lat) return { cx: -100, cy: -100 }; // Move offscreen if missing
            const point = new mapboxgl.LngLat(+station.Long, +station.Lat);
            const { x, y } = map.project(point);
            return { cx: x, cy: y };
          }
  
          // ✅ Add Circles for Each Station
          const circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 6) // Circle size
            .attr('fill', 'steelblue') // Match the example image
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.9);
  
          // ✅ Function to Update Marker Positions
          function updatePositions() {
            circles
              .attr('cx', d => getCoords(d).cx)
              .attr('cy', d => getCoords(d).cy);
          }
  
          // ✅ Initial positioning
          updatePositions();
  
          // ✅ Keep stations aligned when moving or zooming
          map.on('move', updatePositions);
          map.on('zoom', updatePositions);
          map.on('resize', updatePositions);
          map.on('moveend', updatePositions);
  
          console.log('Station markers added successfully!');
        })
        .catch(error => {
          console.error('Error loading JSON:', error);
        });
    });
  });
  