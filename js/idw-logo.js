L.Control.IDWLogo = L.Control.extend({
  initialize: function(options) {
    options['latest-updated-time'] = (typeof options['latest-updated-time'] !== 'undefined') ?
      options['latest-updated-time'] : new Date();
    L.setOptions(this, options);
  },
  onAdd: function(map) {
    if(L.Browser.mobile) {
      this.ifMobile();
      return new L.DomUtil.create('div');
    }
    let date = new Date(this.options['latest-updated-time']),
      latestUpdatedTime = date.toLocaleString("zh-TW", {
        hour12: false, 
        timeZone: "Asia/Taipei", 
        timeZoneName: "short"
      });

    let div = new L.DomUtil.create('div', 'idw-logo leaflet-control-layers');
    div.innerHTML = 
      `<div class="leaflet-control-layers-base">
        <table>
          <thead>
            <tr>
              <td>PM2.5 IDW Diagram</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a target="_blank" rel="noopener noreferrer" href="https://www.iis.sinica.edu.tw/index_zh.html">
                  <img src='./images/AS-logo.png' alt='Academia Sinica'>
                </a>
                <a target="_blank" rel="noopener noreferrer" href="http://lass-net.org/">
                  <img src='./images/LASS-logo.png' alt='Location Aware Sensing System (LASS)'>
                </a>
                <a target="_blank" rel="noopener noreferrer" href='https://github.com/HuangLiPang/pm2.5-idw-with-weather'>
                  <img src="./images/GHRepo-logo.png" alt='GitHub'>
                </a>
                <br>${latestUpdatedTime.replace(/\[GMT\+8\]/i, "GMT\+8")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>`;
    return div;
  },
  ifMobile: function () {
    document.getElementsByClassName("leaflet-control-attribution")[0].innerHTML += ` | <a target="_blank" rel="noopener noreferrer" style="text-decoration: none" href="https://www.iis.sinica.edu.tw/index_zh.html">IIS AS</a>
             | <a target="_blank" rel="noopener noreferrer" style="text-decoration: none" href="http://lass-net.org/">LASS</a>`
  }
});

L.control.IDWLogo = function(options) {
  return new L.Control.IDWLogo(options);
}