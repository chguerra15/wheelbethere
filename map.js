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

      d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json')
        .then(jsonData => {
          const stations = jsonData.data.stations.filter(station =>
            station.Lat && station.Long && !isNaN(station.Lat) && !isNaN(station.Long)
          );

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

          function getCoords(station) {
            const point = map.project([+station.Long, +station.Lat]);
            return { cx: point.x, cy: point.y };
          }

          const circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 6)
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.9);

          function updatePositions() {
            circles
              .attr('cx', d => getCoords(d).cx)
              .attr('cy', d => getCoords(d).cy);
          }

          map.on('render', updatePositions); // More reliable for WebGL updates
          updatePositions(); // Initial update
        })
        .catch(error => {
          console.error('Error loading JSON:', error);
        });
    });
});
