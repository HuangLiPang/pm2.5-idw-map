L.Control.DisplayIDW = L.Control.extend({
  initialize: function(values, options) {
    this.values = values;
    L.setOptions(this, options);
  },
  onAdd: function() {
    let container = L.DomUtil.create('div', 'idw-display');
    container.innerHTML = 
      `<table border=1 cellspacing=0 cellpadding=0 bgcolor='#ffffff' style="font-size: 1.2em;">
        <tr>
          <td align="right" style="border-right-width: 0px;">GPS: </td>
          <td align="center" style="border-left-width: 0px; padding-left: 4px; padding-right: 4px;">${Math.round(this.values[0][0] * 100000.0) / 100000.0}, ${Math.round(this.values[0][1] * 100000.0) / 100000.0}</td>
        </tr>
        <tr>
          <td align="right" style="border-right-width: 0px;">AirBox PM2.5: </td>
          <td align="center" style="border-left-width: 0px; padding-left: 4px; padding-right: 4px;">${this.values[1]} μg/m^3</td>
        </tr>
        <tr>
          <td align="right" style="border-right-width: 0px;">AirBox Temperature: </td>
          <td align="center" style="border-left-width: 0px; padding-left: 4px; padding-right: 4px;">${this.values[2]} °C</td>
        </tr>
        <tr>
          <td align="right" style="border-right-width: 0px;">CWB Temperature: </td>
          <td align="center" style="border-left-width: 0px; padding-left: 4px;">${this.values[3]} °C</td>
        </tr>
      </table>`;
    return container;
  }
});

L.control.displayIDW = function(values, options) {
  return new L.Control.DisplayIDW(values, options);
};