// mapbox access token
L.mapbox.accessToken = 'pk.eyJ1IjoibXltYWt0dWIiLCJhIjoiY2oyNXBwdXVxMDB0YTMybzdkdzl5cjRodSJ9.803z0kHzvQVFMstwjfjCqg';
(function(window) {
  let map;
  let IDWOptions;
  let creditsTemplate;
  let logoContainer;
  let overlays;

  map = L.mapbox.map('map', 'zetter.i73ka9hn', {
    attributionControl: false,
    maxZoom: 16
  }).setView([23.77, 120.88], 8);

  // loading pm2.5 points and update time
  makeRequest('GET', './data/pm25.json')
    .then(function(response) {
      let pm25json = JSON.parse(response);
      let pm25points = pm25json.points;
      // IDW layer options
      IDWOptions = {
        // opacity  - the opacity of the IDW layer
        // cellSize - height and width of each cell, 25 by default
        // exp      - exponent used for weighting, 1 by default
        // max      - maximum point values, 1.0 by default
        // gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        opacity: 0.5,
        maxZoom: 16,
        minZoom: 8,
        cellSize: 5,
        exp: 2,
        max: 200
      };

      // the diagram must be in the following order
      // to make the emission point layer be the
      // most upper layer in the map
      overlays = {
        // IDW layer
        "IDW Diagram": L.idwLayer(pm25points, IDWOptions).addTo(map),

        // contour layer
        "Contour Diagram": L.mapbox.featureLayer()
          .loadURL('./data/pm25Contour.geojson').addTo(map),

        // emission pointe layer
        "Emission Points": L.mapbox.featureLayer()
          .loadURL('./data/emission_points_polygons.geojson').addTo(map)
      };

      logoContainer = L.control.IDWLogo({
        position: 'bottomleft',
        "latest-updated-time": pm25json['latest-updated-time']
      }).addTo(map);

      // layer controller
      L.control.layers({}, overlays, {
        collapsed: false,
        autoZIndex: true
      }).addTo(map);
    })
    .catch(function(error) {
      console.log(error);
    });

  // credits
  creditsTemplate =
    `© <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a>
© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>
<a href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a>`;
  // © <a href='http://lass-net.org'>LASS</a> & <a href='https://sites.google.com/site/cclljj/NRL'>IIS-NRL</a>

  // add credits to map
  L.control.attribution()
    .addAttribution(creditsTemplate).addTo(map);

  // add IDW legend to the map
  L.control.IDWLegend({ position: 'bottomright' }).addTo(map);

  // make request function in promise
  // for loading pm2.5 points
  function makeRequest(method, url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function() {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.send();
    });
  }

  // make variable map a global variable
  window.map = map;
})(this);