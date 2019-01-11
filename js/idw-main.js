(function(window) {
  "use strict";
  // create a map
  let map= L.map("map", {
    attributionControl: true,
    maxZoom: 16
  }).setView([23.77, 120.88], 8);

  // baselayers
  let pm25IDWLayer, tempIDWLayer;
  // IDW layer options
  let IDWOptions = {
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
  let baselayers;

  // overlayers
  let emissionLayer, contourInterval5, contourInterval10;
  let overlayers;

  let baselayerGroup;

  // IDW legend
  let pm25LegendGradients = [
      0,   1,   3,   6,   8, 
     10,  12,  14,  16,  18, 
     20,  25,  30,  35,  40, 
     50,  60,  70,  80,  90, 
    100, 110, 120, 130, 140, 150
  ],
    pm25LegendColorCode = function(d) {
      d = d / 100.0;
      return d < 0.00 ? "#FFFFFF" :
        d < 0.01 ? "#CCCCFF" :
        d < 0.03 ? "#BBBBEE" :
        d < 0.06 ? "#AAAADD" :
        d < 0.08 ? "#9999CC" :
        d < 0.10 ? "#8888BB" :

        d < 0.12 ? "#90FA96" :
        d < 0.14 ? "#82EA64" :
        d < 0.16 ? "#66DA36" :
        d < 0.18 ? "#50CA2C" :
        d < 0.20 ? "#4ABA26" :

        d < 0.25 ? "#FAFA5D" :
        d < 0.30 ? "#EAEA46" :
        d < 0.35 ? "#DADA4D" :
        d < 0.40 ? "#CACA42" :
        d < 0.50 ? "#BABA36" :

        d < 0.6 ? "#FF7777" :
        d < 0.7 ? "#EE6666" :
        d < 0.8 ? "#DD5555" :
        d < 0.9 ? "#CC4444" :
        d < 1.0 ? "#BB3333" :

        d < 1.1 ? "#E056E0" :
        d < 1.2 ? "#D045D0" :
        d < 1.3 ? "#C034C0" :
        d < 1.4 ? "#B023B0" :
        d < 1.5 ? "#A012A0" :
                  "#900190";
    },
    pm25Legend = new L.control.IDWLegend(pm25LegendGradients, pm25LegendColorCode, {
      position: 'bottomright'
    }).addTo(map),
    temperatureLegendGradients = [5, 10, 15, 25, 27, 30, 32, 35],
    temperatureLengendColorCode = function getColor(d){
      d = d / 100.0;
      return d < 0.05 ? "#0000FF":
        d < 0.10 ? "#009AFF":
        d < 0.15 ? "#00CFCF":
        d < 0.25 ? "#00FF00":
        d < 0.27 ? "#CFCF00":
        d < 0.30 ? "#FF9A00":
        d < 0.32 ? "#FF0000":
        d < 0.35 ? "#FF00FF":
                   "#9A009A";
    },
    temperatureLegend = new L.control.IDWLegend(temperatureLegendGradients, temperatureLengendColorCode, {
      position: 'bottomright'
    });
  
  // map tile
  let Stamen_Terrain = new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: `<a target="_blank" rel="noopener noreferrer" href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a> | ` + 
      `Tiles by <a target="_blank" rel="noopener noreferrer" href="http://stamen.com">Stamen Design</a>, ` +
      `&copy; <a target="_blank" rel="noopener noreferrer" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
      // Credits not used
      // <a href='https://sites.google.com/site/cclljj/NRL'>IIS-NRL</a>
    minZoom: 0,
    maxZoom: 16,
    ext: 'png'
  }).addTo(map);

  let urls = [
    "data/data.json",
    "data/emission_points_polygons.geojson", 
    "data/pm25Contour_grey_5.geojson",
    "data/pm25Contour_grey_10.geojson", 
    // "data/gfs.json"
  ];

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

      let pm25IDWGradients = {
        0.001: "#FFFFFF",
        0.01: "#CCCCFF",
        0.03: "#BBBBEE",
        0.06: "#AAAADD",
        0.08: "#9999CC",
        0.10: "#8888BB",

        0.12: "#90FA96",
        0.14: "#82EA64",
        0.16: "#66DA36",
        0.18: "#50CA2C",
        0.20: "#4ABA26",

        0.25: "#FAFA5D",
        0.30: "#EAEA46",
        0.35: "#DADA4D",
        0.40: "#CACA42",
        0.50: "#BABA36",

        0.6: "#FF7777",
        0.7: "#EE6666",
        0.8: "#DD5555",
        0.9: "#CC4444",
        1.0: "#BB3333",

        1.1: "#E046E0",
        1.2: "#D03DD0",
        1.3: "#C032C0",
        1.4: "#B026B0",
        1.5: "#A01DA0"
      },
      tempIDWGradients = {
        0.001: "#FFFFFF",
        0.05: "#0000FF",
        0.10: "#009AFF",
        0.15: "#00CFCF",
        0.25: "#00FF00",
        0.27: "#CFCF00",
        0.30: "#FF9A00",
        0.32: "#FF0000",
        0.35: "#FF00FF"
      };

      pm25IDWLayer = new L.idwLayer(pm25points, 2, pm25IDWGradients, IDWOptions),
      tempIDWLayer = new L.idwLayer(pm25points, 3, tempIDWGradients, IDWOptions);
      baselayers = {
        // IDW layers
        "PM2.5 IDW Diagram": pm25IDWLayer.addTo(map),
        "Temprature IDW Diagram": tempIDWLayer,
      };
      // overlayers
      // L.geoJson doc:
      // https://leafletjs.com/reference-0.7.7.html#geojson
      // emission pointe layer
      emissionLayer = new L.geoJson(jsons[1], {
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
      });
      contourInterval5 = new L.geoJson(jsons[2], {
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
      });
      contourInterval10 = new L.geoJson(jsons[3], {
        style: function (feature) {
          return {
            "color": feature.properties.stroke,
            "weight": feature.properties["stroke-width"]
          };
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(feature.properties.title);
        }
      });
      /*
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
      */

      // the diagram must be in the following order
      // to make the emission point layer be the
      // most upper layer in the map
      overlayers = {
        "Emission Points": emissionLayer,
        // contour layers
        "PM2.5 Contour Interval: 5": contourInterval5,
        "PM2.5 Contour Interval: 10": contourInterval10,
      };

      // add logo container to map
      let logoContainer = new L.control.IDWLogo({
        position: 'bottomleft',
        "latest-updated-time": jsons[0]['latest-updated-time']
      }).addTo(map);

      // add layer controller to map
      let layerController = new L.control.layers(baselayers, overlayers, {
        collapsed: false,
        autoZIndex: true
      }).addTo(map);

      // change gradient when baselayer change
      map.on("baselayerchange", function(baselayer){
        if(baselayer.name === "PM2.5 IDW Diagram") {
          temperatureLegend.removeFrom(map);
          pm25Legend.addTo(map);
        } else if(baselayer.name === "Temprature IDW Diagram") {
          pm25Legend.removeFrom(map);
          temperatureLegend.addTo(map);
        }
      });
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
  // make map a global variable
  window.map = map;
})(this);
