(function(window) {
  let map;
  let IDWOptions;
  let logoContainer;
  let overlays;
  let Stamen_Terrain;
  let urls = [
    "data/data.json",
    "data/emission_points_polygons.geojson", 
    "data/pm25Contour_grey_5.geojson",
    "data/pm25Contour_grey_10.geojson", 
    "data/gfs.json"
  ];

  map = L.map("map", {
    attributionControl: true,
    maxZoom: 16
  }).setView([23.77, 120.88], 8);

  Stamen_Terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: `<a target="_blank" rel="noopener noreferrer" href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a>|` + 
      `Tiles by <a target="_blank" rel="noopener noreferrer" href="http://stamen.com">Stamen Design</a>, ` +
      `&copy; <a target="_blank" rel="noopener noreferrer" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
      // Credits not used
      // <a href='https://sites.google.com/site/cclljj/NRL'>IIS-NRL</a>
    minZoom: 0,
    maxZoom: 16,
    ext: 'png'
  }).addTo(map);

  Promise.all(urls.map(url => makeRequest('GET', url)))
    .then(texts => {
      // parse all texts to json objects
      return texts.map(txt => JSON.parse(txt));
    })
    .then(jsons => {
      // jsons = [
      //    data.json, 
      //    emission_points_polygons.geojson,
      //    pm25Contour_grey_5.geojson,
      //    pm25Contour_grey_10.geojson
      //  ];
      let pm25points = jsons[0].points;
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

        // L.geoJson doc:
        // https://leafletjs.com/reference-0.7.7.html#geojson
        // emission pointe layer
        "Emission Points": L.geoJson(jsons[1], {
          style: function (feature) {
            return {
              "color": feature.properties.stroke,
              "weight": 2,
              "fillOpacity": feature.properties["fill-opacity"],
              "fill": true,
              "fillColor": feature.properties["fill"]
            };
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup(feature.properties.title);
          }
        }).addTo(map),

        // contour layers
        "Contour Interval: 5": L.geoJson(jsons[2], {
          style: function (feature) {
            return {
              // style option doc:
              // https://leafletjs.com/reference-1.3.0.html#path
              "color": feature.properties.stroke,
              "weight": feature.properties["stroke-width"],
            };
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup(feature.properties.title);
          }
        }),
        "Contour Interval: 10": L.geoJson(jsons[3], {
          style: function (feature) {
            return {
              "color": feature.properties.stroke,
              "weight": feature.properties["stroke-width"]
            };
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup(feature.properties.title);
          }
        }).addTo(map),
        "Wind": L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: 'Global Wind',
            displayPosition: 'bottomright',
            displayEmptyString: 'No wind data'
          },
          data: jsons[4],
          maxVelocity: 15,
          colorScale: ["rgb(0, 0, 0)", "rgb(105, 105, 105)", "rgb(128, 128, 128)", "rgb(169, 169, 169)", 
                       "rgb(192, 192, 192)"] 
        }).addTo(map)
      };

      // add logo container to map
      logoContainer = L.control.IDWLogo({
        position: 'bottomright',
        "latest-updated-time": jsons[0]['latest-updated-time']
      }).addTo(map);

      // add IDW legend to the map
      L.control.IDWLegend({ position: 'bottomright' }).addTo(map);

      // add layer controller to map
      L.control.layers({}, overlays, {
        collapsed: false,
        autoZIndex: true
      }).addTo(map);
    })
    .catch(function(error) {
      console.log(error);
    });

  // make request function in promise
  // for loading json and geojson
  function makeRequest(method, url) {
    return new Promise(function(resolve, reject) {
      let xhr = new XMLHttpRequest();
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
