(function(window) {
  "use strict";
  // create a map
  let map = L.map("map", {
    zoomControl: false,
    attributionControl: true,
    maxZoom: 16,
    minZoom: 8
  }).setView([23.77, 120.88], 8);

  // baselayers
  let pm25IDWLayer, temperatureIDWLayer, cwbTempIDWLayer;
  let baselayers;

  // overlayers
  let emissionLayer, contourInterval5, contourInterval10;
  let overlayers;

  let baselayerGroup;
  let pm25Legend, temperatureLegend;
  
  // map tile
  let attribution = `<a target="_blank" rel="noopener noreferrer" href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a> | ` + 
      `Tiles by <a target="_blank" rel="noopener noreferrer" href="http://stamen.com">Stamen Design</a>, ` +
      `&copy; <a target="_blank" rel="noopener noreferrer" href="http://www.openstreetmap.org/copyright">OSM</a>`;
  // let Stamen_Terrain = new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
  //   attribution: attribution,
  //   minZoom: 0,
  //   maxZoom: 16,
  //   ext: 'png'
  // }).addTo(map);

  let urls = [
    "data/data.json",
    "data/pm25Contour_grey_5.geojson",
    "data/pm25Contour_grey_10.geojson", 
    "data/cwb.json",
    // "data/emission_points_polygons.geojson"
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
      // airboxPoints = [[lat, lng, pm2.5, temperature, humidity]]
      let airboxPoints = jsons[0].points;
      let cwbPoints = jsons[3].points;
      let pm25IDWOptions = {
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
        max: 200,
        gradient: {
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
        dataType: 2
      };
      let temperatureIDWOptions = {
        opacity: 0.5,
        maxZoom: 16,
        minZoom: 8,
        cellSize: 5,
        exp: 2,
        max: 200,
        gradient: {
          0.001: "#FFFFFF",
          0.05: "#001f3f",
          0.10: "#0074D9",
          0.15: "#7FDBFF",
          0.17: "#39CCCC",
          0.20: "#3D9970",
          0.22: "#2ECC40",
          0.24: "#01FF70",
          0.25: "#FFDC00",
          0.27: "#FF851B",
          0.30: "#FF4136",
          0.32: "#F012BE",
          0.35: "#B10DC9"
        },
        dataType: 3
      };
      let cwbTemperatureIDWOptions = {
        opacity: 0.5,
        maxZoom: 16,
        minZoom: 8,
        cellSize: 5,
        exp: 2,
        max: 200,
        gradient: {
          0.001: "#FFFFFF",
          0.05: "#001f3f",
          0.10: "#0074D9",
          0.15: "#7FDBFF",
          0.17: "#39CCCC",
          0.20: "#3D9970",
          0.22: "#2ECC40",
          0.24: "#01FF70",
          0.25: "#FFDC00",
          0.27: "#FF851B",
          0.30: "#FF4136",
          0.32: "#F012BE",
          0.35: "#B10DC9"
        },
        dataType: 2
      }
      pm25IDWLayer = new L.idwLayer(airboxPoints, pm25IDWOptions);
      temperatureIDWLayer = new L.idwLayer(airboxPoints, temperatureIDWOptions);
      cwbTempIDWLayer = new L.idwLayer(cwbPoints, cwbTemperatureIDWOptions);
      baselayers = {
        // IDW layers
        "AirBox PM2.5 IDW": pm25IDWLayer.addTo(map),
        "AirBox Temprature IDW": temperatureIDWLayer,
        "CWB Temprature IDW": cwbTempIDWLayer
      };
      // overlayers
      // L.geoJson doc:
      // https://leafletjs.com/reference-0.7.7.html#geojson
      // emission pointe layer
      // emissionLayer = new L.geoJson(jsons[1], {
      //   style: function (feature) {
      //     return {
      //       "color": feature.properties.stroke,
      //       "weight": 2,
      //       "fillOpacity": feature.properties["fill-opacity"],
      //       "fill": true,
      //       "fillColor": feature.properties["fill"]
      //     };
      //   },
      //   onEachFeature: function (feature, layer) {
      //     layer.bindPopup(feature.properties.title);
      //   }
      // });
      contourInterval5 = new L.geoJson(jsons[1], {
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
      contourInterval10 = new L.geoJson(jsons[2], {
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

      // the diagram must be in the following order
      // to make the emission point layer be the
      // most upper layer in the map
      overlayers = {
        // "Emission Points": emissionLayer,
        // contour layers
        "PM2.5 Contour Interval: 5": contourInterval5,
        "PM2.5 Contour Interval: 10": contourInterval10,
      };

      // add layer controller to map
      let layerController = new L.control.layers(baselayers, overlayers, {
        collapsed: false,
        autoZIndex: true
      }).addTo(map);

      if(L.Browser.mobile) {
        // mobile mode
        // remove zoom control
        attribution = attribution.replace("Tiles by ", "");
        layerController.collapse();
        // add legend check
        // change gradient when baselayer change
        map.on("baselayerchange", function(baselayer){
          let layers = document.getElementsByClassName("leaflet-control-layers-selector");
          if(baselayer.name === "AirBox PM2.5 IDW") {
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = false;
              }
            }
          } else if(baselayer.name === "AirBox Temprature IDW" || baselayer.name === "CWB Temprature IDW") {
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = true;
                if(layers[i].checked) {
                  layers[i].checked = false;
                }
              }
            }
            for (let key in overlayers) {
              if(map.hasLayer(overlayers[key])) {
                map.removeLayer(overlayers[key]);
              }
            }
          }
        });
      } else {
        // PC mode
        // add legends
        // IDW legend
        map.addControl(L.control.zoom({position: "topleft"}));
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
          };
          pm25Legend = new L.control.IDWLegend(pm25LegendGradients, pm25LegendColorCode, {
            position: 'bottomright'
          }).addTo(map);
          let temperatureLegendGradients = [
            5, 10, 15, 17, 20, 22,
            24, 25, 27, 30, 32, 35
          ],
          temperatureLengendColorCode = function getColor(d){
            d = d / 100.0;
            return d < 0.05 ? "#001f3f":
              d < 0.10 ? "#0074D9":
              d < 0.15 ? "#7FDBFF":
              d < 0.17 ? "#39CCCC":
              d < 0.20 ? "#3D9970":
              d < 0.22 ? "#2ECC40":
              d < 0.24 ? "#01FF70":
              d < 0.25 ? "#FFDC00":
              d < 0.27 ? "#FF851B":
              d < 0.30 ? "#FF4136":
              d < 0.32 ? "#F012BE":
              d < 0.35 ? "#B10DC9":
                         "#85144b"
          };
          temperatureLegend = new L.control.IDWLegend(temperatureLegendGradients, temperatureLengendColorCode, {
            position: 'bottomright'
          });
        // add legend check
        // change gradient when baselayer change
        map.on("baselayerchange", function(baselayer) {
          let layers = document.getElementsByClassName("leaflet-control-layers-selector");
          if(baselayer.name === "AirBox PM2.5 IDW") {
            temperatureLegend.remove();
            pm25Legend.addTo(map);
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = false;
              }
            }
          } else if(baselayer.name === "AirBox Temprature IDW" || baselayer.name === "CWB Temprature IDW") {
            pm25Legend.remove();
            temperatureLegend.addTo(map);
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = true;
                if(layers[i].checked) {
                  layers[i].checked = false;
                }
              }
            }
            for (let key in overlayers) {
              if(map.hasLayer(overlayers[key])) {
                map.removeLayer(overlayers[key]);
              }
            }
          }
        });
      }
      // disable overlays checkbox when zoomend and the baselayer is temperature idw
      map.on("zoomend", function(event) {
        for(let key in baselayers) {
          if(key.includes("Temprature")) {
            if(map.hasLayer(baselayers[key])) {
              let layers = document.getElementsByClassName("leaflet-control-layers-selector");
              for (let i = layers.length - 1; i >= 0; i--) {
                if(layers[i].type === "checkbox") {
                  layers[i].disabled = true;
                }
              }
            }
          }
        }
      })
      let Stamen_Terrain = new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
        attribution: attribution,
        minZoom: 8,
        maxZoom: 16,
        ext: 'png'
      }).addTo(map);

      // add logo container to map
      let logoContainer = new L.control.IDWLogo({
        position: 'bottomleft',
        "latest-updated-time": jsons[0]['latest-updated-time']
      }).addTo(map);

      let idwMarker = undefined;
      let idwDisplay = undefined;
      map.on('click',
        function mapClickListen(event) {
          let pos = event.latlng;
          if(idwMarker) {
            idwDisplay.remove();
            idwMarker.setLatLng(pos);
          } else {
            idwMarker = new L.idwMarker(
              pos, {
                range: 10.0,
                dataOptions: [[2, 0.0], [3, -20.0], [2, -20.0]],
                p: 2,
                radius: 5,
                points: [airboxPoints, airboxPoints, cwbPoints]
              }).addTo(map);
          }
          idwDisplay = L.control.displayIDW(idwMarker.getIDW(), {
            position: "bottomleft"
          }).addTo(map);
          // close button function
          document.getElementById("idw-display-close-button").onclick = function(event) {
            // avoid click on the map again
            map.off('click', mapClickListen);
            idwMarker.remove();
            idwDisplay.remove();
            idwMarker = undefined;
            idwDisplay = undefined;
            // turn on the map click function
            setTimeout(() => {
              map.on('click', mapClickListen);
            }, 100);
          };
        });
    })
    .catch(function(error) {
      console.log(error);
    });

  // notice setting
  let noticeURL = "notice_en-US.html";
  if(navigator.language === "zh-TW") {
    noticeURL = "notice_zh-TW.html";
  }
  let noticeRequest = makeRequest("GET", noticeURL);
  noticeRequest.then(text => {
    let popup = new L.popup({
      "maxWidth": window.innerWidth * 0.6,
      "className": "airbox-notice"
    }).setContent(text);
    
    if(L.Browser.mobile) {
      popup.setLatLng([22.77, 120.88]).addTo(map);
    } else {
      popup.setLatLng([22.77, 120.88]).addTo(map);
      document.getElementsByClassName("airbox-notice")[0].style.fontSize = "16px";
    }
  }).catch(function(error) {
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
