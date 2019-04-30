L.Control.DisplayIDW = L.Control.extend({
  initialize: function(values, options) {
    this.values = values;
    L.setOptions(this, options);
  },
  onAdd: function() {
    let container = L.DomUtil.create('div', 'idw-display leaflet-control-layers');
    container.innerHTML = 
      `<div class="leaflet-control-layers-base">
        <table>
          <tr>
            <td>GPS: </td>
            <td>${Math.round(this.values[0][0] * 1000.0) / 1000.0}, ${Math.round(this.values[0][1] * 1000.0) / 1000.0}</td>
          </tr>
          <tr>
            <td>AirBox PM2.5: </td>
            <td>${this.values[1]} μg/m<sup>3</sup></td>
          </tr>
          <tr>
            <td>AirBox Temp: </td>
            <td>${this.values[2]} °C</td>
          </tr>
          <tr>
            <td>CWB Temp: </td>
            <td>${this.values[3]} °C</td>
          </tr>
          <tr>
            <td>EPA PM2.5: </td>
            <td>${this.values[4]} μg/m<sup>3</sup></td>
          </tr>
          <tr>
            <td>Calibrated AirBox PM2.5: </td>
            <td>${this.values[5]} μg/m<sup>3</sup></td>
          </tr>
          <tr>
            <td>Calibrated AirBox vs EPA: </td>
            <td>${this.values[6]}</td>
          </tr>
        </table>
      </div>
      <div>
        <a id="idw-display-close-button" class="leaflet-popup-close-button" href="#close">×</a>
      </div>`;
    return container;
  }
});

L.control.displayIDW = function(values, options) {
  return new L.Control.DisplayIDW(values, options);
};