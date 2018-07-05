L.Control.IDWLogo = L.Control.extend({
  initialize: function(options) {
    options['latest-updated-time'] = (typeof options['latest-updated-time'] !== 'undefined') ?
      options['latest-updated-time'] : new Date();
    L.setOptions(this, options);
  },
  onAdd: function(map) {
    let date = new Date(this.options['latest-updated-time']),
      latestUpdatedTime = date.toLocaleString("zh-TW", {
        hour12: false, 
        timeZone: "Asia/Taipei", 
        timeZoneName: "short"
      });

    let div = L.DomUtil.create('div', 'logo');
    div.innerHTML = 
      `<table border=1 cellspacing=0 cellpadding=0 bgcolor='#000080'>
        <tr bgcolor='#000080'>
          <td align="center">
            <font size='+1' color='#FFFFFF'><b>PM2.5 IDW Diagram</b></font>
          </td>
        </tr>
        <tr bgcolor='#ffffff'>
          <td align='center' style="padding: 3px 5px;">
            <a target="_blank" rel="noopener noreferrer" style="text-decoration: none" href="https://www.iis.sinica.edu.tw/index_zh.html">
              <img src='./images/AS-logo.png' alt='Academia Sinica' height=40>
            </a>
            <a target="_blank" rel="noopener noreferrer" style="text-decoration: none" href="http://lass-net.org/">
              <img src='./images/LASS-logo.png' alt='Location Aware Sensing System (LASS)' height=40>
            </a>
            <a target="_blank" rel="noopener noreferrer" style="text-decoration: none" href='https://github.com/HuangLiPang/pm2.5-idw-with-weather'>
              <img src="./images/GitHub-logo.png" alt='GitHub' height=40>
            </a>
            <br>
            <font size='+1' color='#000000'>${latestUpdatedTime}</font>
          </td>
        </tr>
      </table>`;
    return div;
  }
});

L.control.IDWLogo = function(options) {
  return new L.Control.IDWLogo(options);
}