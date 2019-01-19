(function(window) {
  "use strict";
  // create a map
  let map= L.map("map", {
    attributionControl: true,
    maxZoom: 16
  }).setView([23.77, 120.88], 8);

  // baselayers
  let pm25IDWLayer, temperatureIDWLayer;
  let baselayers;

  // overlayers
  let emissionLayer, contourInterval5, contourInterval10;
  let overlayers;

  let baselayerGroup;
  let pm25Legend, temperatureLegend;
  if(L.Browser.mobile) {
    // mobile mode
    // remove zoom control
    map.removeControl(map.zoomControl);
  } else{
    // PC mode
    // add legends
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
    }
  
  // map tile
  let Stamen_Terrain = new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: `<a target="_blank" rel="noopener noreferrer" href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a> | ` + 
      `Tiles by <a target="_blank" rel="noopener noreferrer" href="http://stamen.com">Stamen Design</a>, ` +
      `&copy; <a target="_blank" rel="noopener noreferrer" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
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
      // airboxPoints = [[lat, lng, pm2.5, temperature, humidity]]
      let airboxPoints = jsons[0].points;

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

      pm25IDWLayer = new L.idwLayer(airboxPoints, pm25IDWOptions),
      temperatureIDWLayer = new L.idwLayer(airboxPoints, temperatureIDWOptions);
      baselayers = {
        // IDW layers
        "PM2.5 IDW Diagram": pm25IDWLayer.addTo(map),
        "Temprature IDW Diagram": temperatureIDWLayer,
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

      if(!L.Browser.mobile) {
        // PC mode
        // add legend event
        // change gradient when baselayer change
        map.on("baselayerchange", function(baselayer){
          if(baselayer.name === "PM2.5 IDW Diagram") {
            temperatureLegend.remove();
            pm25Legend.addTo(map);
          } else if(baselayer.name === "Temprature IDW Diagram") {
            pm25Legend.remove();
            temperatureLegend.addTo(map);
          }
        });
      }
      let markerCounter = 0;
      let tooltipFlag = 0;
      map.on('click',
        function mapClickListen(event) {
          if(markerCounter === 2) {
            return;
          }
          markerCounter++;
          let pos = event.latlng;
          let marker = new L.marker(
            pos, {
              draggable: true
            });
          marker.on('add dragend', function showIDW(event) {
            // console.log('marker dragend event');
            // console.log(event.target._latlng);
            if(tooltipFlag === 0) {
              tooltipFlag = 1;
              this.bindTooltip("double tap to remove the marker.", { permanent: true }).openTooltip();
              setTimeout(() => {
                if(this.isTooltipOpen()) this.closeTooltip();
              }, 3000);
            }
            let latlng = event.target._latlng;
            let airboxInCell = airboxPoints.filter(point => {
              let airboxCoordinate = new L.latLng(point[0], point[1]);
              let distance = airboxCoordinate.distanceTo(latlng) / 1000.0;
              return distance < 10.0;
            })
            // Inverse Distance Weighting (IDW)
            //       Σ (1 / (di ^ p)) * vi
            // V = -------------------------
            //          Σ (1 / (di ^ p))
            // Reference:
            // http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml
            
            // cellsn = Σ (1 / (di ^ p)) * vi
            // cellsd = Σ (1 / (di ^ p))
            let p = 2;
            let pm25Cellsn = 0.0;
            let pm25Cellsd = 0.0;
            let temperatureCellsn = 0.0;
            let temperatureCellsd = 0.0;
            let pm25V = 0.0;
            let temperatureV = 0.0;
            airboxInCell.every(airbox => {
              // console.log(airbox);
              let airboxCoordinate = new L.latLng(airbox[0], airbox[1]);
              // console.log(airboxCoordinate);
              let distance = airboxCoordinate.distanceTo(latlng) / 1000.0;
              if(distance === 0) {
                pm25V = airbox[2];
                temperatureV = airbox[3];
                return false;
              }
              let distanceRev = 1 / (distance ^ p);
              if(distanceRev !== Infinity) {
                if(airbox[2] > 0.0) {
                  pm25Cellsn += distanceRev * airbox[2];
                  pm25Cellsd += distanceRev;
                }
                if(airbox[3] > 0.0) {
                  temperatureCellsn += distanceRev * airbox[3];
                  temperatureCellsd += distanceRev;
                }
              }
              return true;
            });
            pm25V = Math.round(pm25Cellsn / pm25Cellsd * 10) / 10.0;
            temperatureV = Math.round(temperatureCellsn / temperatureCellsd * 10) / 10.0;
            marker.bindPopup(`<p>Coordinate: ${latlng.lat}, ${latlng.lng}<br />
            PM2.5: ${pm25V}<br /> 
            Temprature: ${temperatureV}</p>`, {
              "maxWidth": window.innerWidth * 0.4,
              "autoClose": false,
              "closeOnClick": false
            }).openPopup();
          });
          marker.on("dblclick", function removeMarker(event) {
            // this === marker
            this.closeTooltip();
            this.removeFrom(map);
            markerCounter--;
          });
          marker.addTo(map);
        });
    })
    .catch(function(error) {
      console.log(error);
    });

  // notice setting
  let currentLanguage = navigator.language;
  let noticeURL;
  if(currentLanguage === "zh-TW") {
    noticeURL = "notice_zh-TW.html";
  } else {
    noticeURL = "notice_en-US.html"
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
      popup.setLatLng([23.77, 120.88]).addTo(map);
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
