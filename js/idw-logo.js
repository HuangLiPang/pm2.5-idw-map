L.Control.IDWLogo = L.Control.extend({
  initialize: function(options) {
    options['latest-updated-time'] = (typeof options['latest-updated-time'] !== 'undefined') ? 
      options['latest-updated-time'] : new Date();
    L.setOptions(this, options);
  },
  onAdd: function(map) {
    let date = new Date(this.options['latest-updated-time']),
      timezone = date.toString().split(/\s/)[6],
      latestUpdatedTime = date.toLocaleString("en-us", { hour12: false }) + " " + timezone;

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
              <font>${latestUpdatedTime}</font>
            </td>
          </tr>
        </table>`;
    return div;
  }
});

L.control.IDWLogo = function(options) {
  return new L.Control.IDWLogo(options);
}