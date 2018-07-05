L.Control.IDWLegend = L.Control.extend({
  onAdd: function(map) {
    let div = L.DomUtil.create('div', 'idw-legend'),
      gradesLabels = '',
      grades = [
          0,   1,   3,   6,   8, 
         10,  12,  14,  16,  18, 
         20,  25,  30,  35,  40, 
         50,  60,  70,  80,  90, 
        100, 110, 120, 130, 140, 150
      ];

    // loop through our density intervals and 
    // generate a label with a colored square for each interval
    for(let i = 0; i < grades.length; i++) {
      let color = this.getColor(grades[i] + 1);
      gradesLabels +=
        `<i style="background:${color};">&nbsp;&nbsp;&nbsp;&nbsp;</i>&nbsp;` + 
        `${grades[i]}${(grades[i + 1] ? `&ndash;${grades[i + 1]}` : '+')}<br>`;
    }
    div.innerHTML =
      `<table border=1 bgcolor="#ffffff" cellspacing=0 cellpadding=5>
        <tr>
          <td bgcolor="#ffffff">
            <font size="-1">${gradesLabels}</font>
          </td>
        </tr>
      </table>`;

    return div;
  },
  getColor: function(d) {
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
  }
});

L.control.IDWLegend = function(options) {
  return new L.Control.IDWLegend(options);
};