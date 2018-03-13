// maobox access token
L.mapbox.accessToken = 'pk.eyJ1IjoibXltYWt0dWIiLCJhIjoiY2oyNXBwdXVxMDB0YTMybzdkdzl5cjRodSJ9.803z0kHzvQVFMstwjfjCqg';

let map;
let IDWLayer, IDWOptions;
let emissionPointsLayer;
let credits, creditsTemplate;
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
    IDWLayer = L.idwLayer(pm25points, IDWOptions).addTo(map);

    // logo date
    let date = new Date(pm25json.version),
      timezone = date.toString().split(/\s/),
      version = date.toLocaleString("en-us", { hour12: false }) + " " + timezone[6];

    // logo container
    logoContainer = L.control({ position: 'bottomleft' });
    logoContainer.onAdd = function(map) {
      let div = L.DomUtil.create('div', 'logo');
      div.innerHTML =
        `<table border=1 cellspacing=0 cellpadding=0 bgcolor='#000080'>
          <tr bgcolor='#000080'>
            <td align='center'>
              <font size='+1' color='#FFFFFF'><b>PM2.5 IDW Diagram</b></font>
            </td>
          </tr>
          <tr bgcolor='#ffffff'>
            <td align='center'>
              <img src='./images/AS-logo.png' alt='Academia Sinica' height=55>
              <img src='./images/LASS-logo.png' alt='Location Aware Sensing System (LASS)' height=55>
              <br>
              <font>${version}</font>
            </td>
          </tr>
        </table>`;
      return div;
    };
    logoContainer.addTo(map);
  })
  .catch(function(error) {
    console.log(error);
  });

// Load emission points to map
emissionPointsLayer = L.mapbox.featureLayer()
  .loadURL('/data/Emission_Points_Polygons.geojson')
  .addTo(map);

credits = L.control.attribution().addTo(map);
creditsTemplate =
  `© <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a>
  © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>
  <a href='http://creativecommons.org/licenses/by-nc-sa/4.0/'>CC-BY-NC-SA</a>`;
// © <a href='http://lass-net.org'>LASS</a> & <a href='https://sites.google.com/site/cclljj/NRL'>IIS-NRL</a>
credits.addAttribution(creditsTemplate);

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