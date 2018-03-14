// mapbox access token
L.mapbox.accessToken = 'pk.eyJ1IjoibXltYWt0dWIiLCJhIjoiY2oyNXBwdXVxMDB0YTMybzdkdzl5cjRodSJ9.803z0kHzvQVFMstwjfjCqg';
(function(window) {
  let map;
  let IDWLayer, IDWOptions;
  let emissionPointsLayer;
  let creditsTemplate;
  let logoContainer;

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
        opacity: 0.5,
        maxZoom: 16,
        minZoom: 8,
        cellSize: 5,
        exp: 2,
        max: 200
      };
      // IDW layer
      IDWLayer = L.idwLayer(pm25points, IDWOptions)
        .addTo(map);

      logoContainer = L.control.IDWLogo({
        position: 'bottomleft',
        "latest-updated-time": pm25json['latest-updated-time']
      }).addTo(map);
    })
    .catch(function(error) {
      console.log(error);
    });

  // load emission points to map
  emissionPointsLayer = L.mapbox.featureLayer()
    .loadURL('/data/Emission_Points_Polygons.geojson')
    .addTo(map);

  // credits
  creditsTemplate =
    `© <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a>
© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>
<a href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a>`;
  // © <a href='http://lass-net.org'>LASS</a> & <a href='https://sites.google.com/site/cclljj/NRL'>IIS-NRL</a>
  L.control.attribution()
    .addAttribution(creditsTemplate).addTo(map);

  let IDWlegend = L.control.IDWLegend({ position: 'bottomright' }).addTo(map);

  // make request function in promise
  // use for loading pm2.5 points
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

  // make map become a global variable
  window.map = map;
}) (this);