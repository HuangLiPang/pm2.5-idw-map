L.Control.IDWLegend = L.Control.extend({
  initialize: function(gradients, options) {
    this.gradients = this._transformGradient(gradients);
    this.unit = options.unit;
    L.Util.setOptions(this, options);
  },

  onAdd: function(map) {
    let container = L.DomUtil.create('div', 'idw-legend leaflet-control-layers'),
      gradesLabels = '',
      gradientsLength = this.gradients.length;
    let numLength = 0;
    for(let i = 0; i < gradientsLength; i++) {
      let length = this.gradients[i].key.toString().length;
      if(numLength < length) numLength = length;
    }
    // loop through our density intervals and 
    // generate a label with a colored square for each interval
    for(let i = 0; i < gradientsLength; i++) {
      let color = this.gradients[i].value;
        gradesLabels +=
          `<i style="background:${color};">&nbsp;&nbsp;&nbsp;&nbsp;</i>&nbsp;` + 
          `${this._formatNumber(numLength, this.gradients[i].key)}` + 
          `${(this.gradients[i + 1] ? 
            `&nbsp;~&nbsp;${this._formatNumber(numLength, this.gradients[i + 1].key)}` : '+')}<br>`;
    }
    container.innerHTML =
      `<div class="leaflet-control-layers-base">
        <table>
          <tr>
            <td>${gradesLabels}</td>
          </tr>
          <tr>
            <td>${this.unit}</td>
          </tr>
        </table>
      </div>`;

    return container;
  },
  _transformGradient: function(gradients) {
    let newGradients = [];
    for(let i in gradients) {
      newGradients.push({key: +i, value: gradients[i]});
    }
    return newGradients.sort((item1, item2) => {
      return +item1.key - +item2.key;
    });
  },
  _formatNumber: function(length, number) {
    let result = number.toString();
    let numLength = result.length;
    result = result.replace("-", `&ndash;`);
    if(numLength < length) {
      for(let i = 0; i < length - numLength; i++) {
        result = "&nbsp;&nbsp;" + result;
      }
    }
    return result;
  }
});

L.control.IDWLegend = function(gradients, options) {
  return new L.Control.IDWLegend(gradients, options);
};