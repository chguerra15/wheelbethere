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
          const stations = jsonData.data.stations;
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
  
          // ✅ Use projection to align points correctly
          const projection = d3.geoMercator()
            .center([-71.09415, 42.36027])  // Center on Boston
            .scale(100000)  // Adjust to fit map scale
            .translate([map.getCanvas().clientWidth / 2, map.getCanvas().clientHeight / 2]);
  
          // ✅ Plot station markers as circles
          svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('cx', d => projection([d.Long, d.Lat])[0])
            .attr('cy', d => projection([d.Long, d.Lat])[1])
            .attr('r', 5)
            .attr('fill', 'red')
            .attr('opacity', 0.8)
            .on('mouseover', function(event, d) {
              d3.select(this).attr('r', 8);
            })
            .on('mouseout', function(event, d) {
              d3.select(this).attr('r', 5);
            });
  
          console.log('Station markers added!');
        })
        .catch(error => {
          console.error('Error loading JSON:', error);
        });
    });
  });
  