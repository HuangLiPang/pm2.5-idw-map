L.Control.IDWLegend = L.Control.extend({
  initialize: function(gradients, colorCode, options) {
    this.gradients = gradients;
    this.colorCode = colorCode;
    L.Util.setOptions(this, options);
  },

  onAdd: function(map) {
    let container = L.DomUtil.create('div', 'idw-legend leaflet-control-layers'),
      gradesLabels = '';

    // loop through our density intervals and 
    // generate a label with a colored square for each interval
    for(let i = 0; i < this.gradients.length; i++) {
      let color = this.colorCode(this.gradients[i] + 1);
      gradesLabels +=
        `<i style="background:${color};">&nbsp;&nbsp;&nbsp;&nbsp;</i>&nbsp;` + 
        `${this.gradients[i]}${(this.gradients[i + 1] ? `&ndash;${this.gradients[i + 1]}` : '+')}<br>`;
    }
    container.innerHTML =
      `<div class="leaflet-control-layers-base">
        <table>
          <tr>
            <td>${gradesLabels}</td>
          </tr>
        </table>
      </div>`;

    return container;
  }
});

L.control.IDWLegend = function(gradients, colorCode, options) {
  return new L.Control.IDWLegend(gradients, colorCode, options);
};