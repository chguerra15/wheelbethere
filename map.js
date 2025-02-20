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
  
    map.on('load', () => {
      // Load the JSON file
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
  });
  