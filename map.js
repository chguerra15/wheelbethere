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
  
      // ✅ Add Boston bike lanes data source
      map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
      });
  
      // ✅ Add Cambridge bike lanes data source
      map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://opendata.arcgis.com/datasets/cambridge::bike-lanes.geojson'
      });
  
      // ✅ Style and visualize Boston bike lanes
      map.addLayer({
        id: 'bike-lanes-boston',
        type: 'line',
        source: 'boston_route',
        paint: {
          'line-color': '#32D400', // Bright green
          'line-width': 4,
          'line-opacity': 0.6
        }
      });
  
      // ✅ Style and visualize Cambridge bike lanes
      map.addLayer({
        id: 'bike-lanes-cambridge',
        type: 'line',
        source: 'cambridge_route',
        paint: {
          'line-color': '#0088FF', // Blue for differentiation
          'line-width': 4,
          'line-opacity': 0.6
        }
      });
  
      console.log('Bike lanes added to map!');
    });
  
    // ✅ Load bike stations from your JSON file
    d3.json('bluebikes-stations.json').then(jsonData => {
      if (!jsonData.data || !jsonData.data.stations) {
        console.error('Invalid JSON structure:', jsonData);
        return;
      }
  
      jsonData.data.stations.forEach(station => {
        const { lat, lon, name } = station;
  
        new mapboxgl.Marker()
          .setLngLat([lon, lat])
          .setPopup(new mapboxgl.Popup().setText(name)) // Show station name on click
          .addTo(map);
      });
  
      console.log('Loaded and displayed station markers:', jsonData.data.stations);
    }).catch(error => {
      console.error('Error loading JSON:', error);
    });
  });
  