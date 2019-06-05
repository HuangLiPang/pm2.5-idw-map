(function(window) {
  "use strict";
  // ga
  makeRequest("GET", "js/gaid.js")
    .then(id => {
      let script = document.createElement("script");
      script.setAttribute("src", `https://www.googletagmanager.com/gtag/js?id=${id}`);
      script.setAttribute("async", '');
      document.body.appendChild(script);
      let gtag = document.createElement("script");
      gtag.innerText = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', "${id}");`;
      document.body.appendChild(gtag);
    })
    .catch(err => console.log(err));

  // create a map
  let mapOptions = {
    preferCanvas: true,
    zoomControl: false,
    attributionControl: true,
    maxZoom: 16,
    minZoom: 4
  };
  let map = L.map("map", mapOptions).setView([23.77, 120.88], 8);

  // baselayers
  let pm25IDWLayer, temperatureIDWLayer, cwbTempIDWLayer, epaPm25IDWLayer, calPm25IDWLayer;
  let pm25Gradient = {
    0: "#F9F9F9",
    1: "#CCCCFF",
    3: "#BBBBEE",
    6: "#AAAADD",
    8: "#9999CC",
    10: "#8888BB",

    12: "#90FA96",
    14: "#82EA64",
    16: "#66DA36",
    18: "#50CA2C",
    20: "#4ABA26",

    25: "#FAFA5D",
    30: "#EAEA46",
    35: "#DADA4D",
    40: "#CACA42",
    50: "#BABA36",

    60: "#FF7777",
    70: "#EE6666",
    80: "#DD5555",
    90: "#CC4444",
    100: "#BB3333",

    110: "#E046E0",
    120: "#D03DD0",
    130: "#C032C0",
    140: "#B026B0",
    150: "#A01DA0"
  },
    tempGradient = {
    // "-20": "#F9F9F9",
    "-10": "#e5e5e5",
    0: "#cccccc",
    5: "#0074D9",
    10: "#7fb9ec",
    15: "#7FDBFF",
    17: "#39CCCC",
    20: "#3D9970",
    22: "#2ECC40",
    24: "#01FF70",
    25: "#FFDC00",
    27: "#FF851B",
    30: "#FF4136",
    32: "#F012BE",
    35: "#B10DC9",
    40: "#85144b",
    50: "#4f0c2d",
    60: "#270616"
  };
  let baselayers;

  // overlayers
  let contourInterval10;
  let overlayers;

  let pm25Legend, temperatureLegend, cpLegend;
  
  // map tile
  let attribution = `<a target="_blank" rel="noopener noreferrer" href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a> | ` + 
      `Tiles by <a target="_blank" rel="noopener noreferrer" href="http://stamen.com">Stamen Design</a>, ` +
      `&copy; <a target="_blank" rel="noopener noreferrer" href="http://www.openstreetmap.org/copyright">OSM</a>`;

  let urls = [
    "data/data.json",
    "data/pm25Contour_grey_10.geojson", 
    "data/cwb.json",
    "data/epa.json",
    "data/calibration.json"
  ];

  Promise.all(urls.map(url => makeRequest('GET', url)))
    .then(texts => {
      // parse all texts to json objects
      return texts.map(txt => JSON.parse(txt));
    })
    .then(jsons => {
      // jsons = [
      //    data.json, 
      //    pm25Contour_grey_10.geojson,
      //    cwb.json
      //  ];
      // airboxPoints = [[lat, lng, pm2.5, temperature, humidity]]
      let airboxPoints = jsons[0].points;
      let cwbPoints = jsons[2].points;
      let epaPoints = jsons[3].points;
      let calPoints = jsons[4].points;



      // compare EPA
      let comparePoints = [];

      let findNearestStation = function(point, targets) {
        let distanceArray = [];
        targets.forEach((target, index) => {
          distanceArray.push([index, map.distance(
            [point[0], point[1]], 
            [target[0],target[1]])]
          );
        });
        distanceArray.sort((a, b) => {
          if(a[1] > b[1]) return 1;
          if(a[1] < b[1]) return -1;
          return 0;
        });
        return distanceArray[0];
      };
      calPoints.forEach((point, index) => {
        let nearest = findNearestStation(point, epaPoints);
        // console.log(point[2] / epaPoints[nearest[0]][2]);
        comparePoints.push([point[0], point[1], point[2] / epaPoints[nearest[0]][2]]);
      });
      let cpGradient = {
        0: "#9C27B0",
        0.1: "#673AB7",
        0.2: "#3F51B5",
        0.3: "#2196F3",
        0.4: "#29B6F6",
        0.5: "#4FC3F7",
        0.6: "#4DD0E1",

        0.7: "#4DB6AC",
        0.8: "#26A69A",
        0.9: "#009688",
        1.0: "#4CAF50",
        1.1: "#66BB6A",
        1.2: "#9CCC65",
        1.3: "#AED581",

        1.4: "#DCE775",
        1.5: "#FFF176",
        1.6: "#FFEE58",
        1.7: "#FFC107",
        1.8: "#FF9800",
        1.9: "#FB8C00",
        2.0: "#E64A19",

        3.0: "#BF360C",
        4.0: "#8D6E63",
        5.0: "#795548",
        6.0: "#6D4C41"
      };
      let cpOptions =  {
        opacity: 0.5,
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom,
        cellSize: 5,
        exp: 2,
        gradient: cpGradient,
        dataType: 2,
        station_range: 10,
        minVal: 0.0,
        maxVal: 6.0
      };

      let cpIDWLayer = new L.idwLayer(comparePoints, cpOptions);
      // compare EPA

      let pm25IDWOptions = {
        // opacity  - the opacity of the IDW layer
        // cellSize - height and width of each cell, 25 by default
        // exp      - exponent used for weighting, 1 by default
        // max      - maximum point values, 1.0 by default
        // gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        opacity: 0.5,
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom,
        cellSize: 5,
        exp: 2,
        gradient: pm25Gradient,
        dataType: 2,
        station_range: 10,
        minVal: 0.0,
        maxVal: 150.0
      };
      let temperatureIDWOptions = {
        opacity: 0.5,
        maxZoom: mapOptions.maxZoo,
        minZoom: mapOptions.minZoom,
        cellSize: 5,
        exp: 2,
        gradient: tempGradient,
        dataType: 3,
        station_range: 10,
        minVal: -10.0,
        maxVal: 60.0
      };
      let cwbTemperatureIDWOptions = {
        opacity: 0.5,
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom,
        cellSize: 5,
        exp: 2,
        gradient: tempGradient,
        dataType: 2,
        station_range: 10,
        minVal: -10.0,
        maxVal: 60.0
      };
      let epaPm25IDWOptions = {
        opacity: 0.5,
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom,
        cellSize: 5,
        exp: 2,
        gradient: pm25Gradient,
        dataType: 2,
        station_range: 10,
        minVal: 0.0,
        maxVal: 150.0
      };
      let calPm25IDWOptions = {
        opacity: 0.5,
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom,
        cellSize: 5,
        exp: 2,
        gradient: pm25Gradient,
        dataType: 2,
        station_range: 10,
        minVal: 0.0,
        maxVal: 150.0
      };
      pm25IDWLayer = new L.idwLayer(airboxPoints, pm25IDWOptions);
      temperatureIDWLayer = new L.idwLayer(airboxPoints, temperatureIDWOptions);
      cwbTempIDWLayer = new L.idwLayer(cwbPoints, cwbTemperatureIDWOptions);
      epaPm25IDWLayer = new L.idwLayer(epaPoints, epaPm25IDWOptions);
      calPm25IDWLayer = new L.idwLayer(calPoints, calPm25IDWOptions);
      baselayers = {
        // IDW layers
        "AirBox PM2.5": pm25IDWLayer.addTo(map),
        "EPA PM2.5": epaPm25IDWLayer,
        "Calibrated AirBox PM2.5": calPm25IDWLayer,
        "Calibrated AirBox vs EPA": cpIDWLayer,
        "AirBox Temperature": temperatureIDWLayer,
        "CWB Temperature": cwbTempIDWLayer,
      };
      // overlayers
      contourInterval10 = new L.geoJson(jsons[1], {
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
      
      let airboxStations = new L.layerGroup();
      for (var i = airboxPoints.length - 1; i >= 0; i--) {
        // find calibrated airbox
        let calStation = calPoints.find(calPoint => {
          return airboxPoints[i][0].toFixed(3) == calPoint[0].toFixed(3) &&
             airboxPoints[i][1].toFixed(3) == calPoint[1].toFixed(3);
        });
        let color = "#5D6D7E";
        let popup = `PM2.5: ${airboxPoints[i][2]} μg/m<sup>3</sup><br>
          Temp: ${airboxPoints[i][3]} °C<br>
          Humidity: ${airboxPoints[i][4]}`;
        if(calStation !== undefined) {
          color = "#1B4F72";
          popup += `<br>
            Calibrated PM2.5: ${calStation[2]}`;
        }
        L.circleMarker(L.latLng(airboxPoints[i][0], airboxPoints[i][1]), {
          radius: 5,
          color: color,
        }).bindPopup(popup).addTo(airboxStations);
      }
      let cwbStations = new L.layerGroup();
      for (var i = cwbPoints.length - 1; i >= 0; i--) {
        L.circleMarker(L.latLng(cwbPoints[i][0], cwbPoints[i][1]), {
          radius: 5,
          color: "#D35400",
        }).bindPopup(`Temp: ${cwbPoints[i][2]} °C`).addTo(cwbStations);
      }
      let epaStations = new L.layerGroup();
      for (var i = epaPoints.length - 1; i >= 0; i--) {
        L.circleMarker(L.latLng(epaPoints[i][0], epaPoints[i][1]), {
          radius: 5,
          color: "#0A1CF9",
        }).bindPopup(`PM2.5: ${epaPoints[i][2]} μg/m<sup>3</sup><br>`).addTo(epaStations);
      }
      // the diagram must be in the following order
      // to make the emission point layer be the
      // most upper layer in the map
      overlayers = {
        // contour layers
        "PM2.5 Contour Interval: 10": contourInterval10,
        "AirBox Stations": airboxStations,
        "CWB Stations": cwbStations,
        "EPA Stations": epaStations
      };

      map.on("overlayadd baselayerchange", event => {
        document
          .getElementsByClassName("leaflet-idwmap-layer leaflet-layer leaflet-zoom-animated")[0]
          .style.zIndex = "0";
      });

      // add layer controller to map
      let layerController = new L.control.layers(baselayers, overlayers, {
        collapsed: false,
        autoZIndex: true,
        position: "topleft"
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
          if(baselayer.name.includes("PM2.5") || baselayer.name.includes("vs")) {
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = false;
              }
            }
          } else if(baselayer.name.includes("Temperature")) {
            if(map.hasLayer(overlayers["PM2.5 Contour Interval: 10"])) {
              map.removeLayer(overlayers["PM2.5 Contour Interval: 10"]);
            }
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox" && 
                layers[i].nextSibling.innerText.includes("Contour")) {
                layers[i].disabled = true;
                layers[i].checked = false;
              }
            }
          }
        });
      } else {
        // PC mode
        // add legends
        // IDW legend
        cpLegend = new L.control.IDWLegend(cpGradient, {
          position: 'bottomright',
          unit: ""
        });
        map.addControl(L.control.zoom({position: "topright"}));
        pm25Legend = new L.control.IDWLegend(pm25Gradient, {
          position: 'bottomright',
          unit: "Unit: μg/m<sup>3</sup>"
        }).addTo(map);
        temperatureLegend = new L.control.IDWLegend(tempGradient, {
          position: 'bottomright',
          unit: "Unit: °C"
        });
        // add legend check
        // change gradient when baselayer change
        map.on("baselayerchange", function(baselayer) {
          let layers = document.getElementsByClassName("leaflet-control-layers-selector");
          if(baselayer.name.includes("PM2.5")) {
            if(temperatureLegend._map) temperatureLegend.remove();
            if(cpLegend._map) cpLegend.remove();
            pm25Legend.addTo(map);
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = false;
              }
            }
          } else if(baselayer.name.includes("Temperature")) {
            if(cpLegend._map) cpLegend.remove();
            if(pm25Legend) pm25Legend.remove();
            temperatureLegend.addTo(map);
            if(map.hasLayer(overlayers["PM2.5 Contour Interval: 10"])) {
              map.removeLayer(overlayers["PM2.5 Contour Interval: 10"]);
            }
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox" && 
                layers[i].nextSibling.innerText.includes("Contour")) {
                layers[i].disabled = true;
                layers[i].checked = false;
              }
            }
          } else if(baselayer.name.includes("vs")) {
            if(temperatureLegend._map) temperatureLegend.remove();
            if(pm25Legend) pm25Legend.remove();
            cpLegend.addTo(map);
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox") {
                layers[i].disabled = false;
              }
            }
          }
        });
      }
      // disable overlayers checkbox when zoomend and the baselayer is temperature idw
      map.on("zoomend", function(event) {
        for(let key in baselayers) {
          if(key.includes("Temperature") && map.hasLayer(baselayers[key])) {
            let layers = document.getElementsByClassName("leaflet-control-layers-selector");
            for (let i = layers.length - 1; i >= 0; i--) {
              if(layers[i].type === "checkbox" && layers[i].nextSibling.innerText.includes("Contour")) {
                layers[i].disabled = true;
              }
            }
          }
        }
      })
      let Stamen_Terrain = new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
        attribution: attribution,
        minZoom: mapOptions.minZoom,
        maxZoom: mapOptions.maxZoom,
        ext: 'png',
        opacity: 0.8
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
                dataOptions: [[2, 0.0], [3, -20.0], [2, -20.0], [2, 0.0], [2, 0.0], [2, 0.0]],
                p: 2,
                radius: 5,
                points: [airboxPoints, airboxPoints, cwbPoints, epaPoints, calPoints, comparePoints]
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
          // If it fails, reject the promise with a error message
          reject({
            url: url,
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function() {
        // Also deal with the case when the entire request fails to begin with
        // This is probably a network error, so reject the promise with an appropriate message
        reject({
          url: url,
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
