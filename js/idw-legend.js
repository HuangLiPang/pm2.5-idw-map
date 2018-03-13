  function getColor(d) {
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
      // d < 0.25? "#3A781C":

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
      //2.00:        "#701010",

      //d < 1.1? "#F04DF0":
      d < 1.1 ? "#E056E0" :
      //d < 1.3? "#D042D0":
      d < 1.2 ? "#D045D0" :
      //d < 1.5? "#B036B0":
      d < 1.3 ? "#C034C0" :
      //d < 1.7? "#902D90":
      d < 1.4 ? "#B023B0" :
      //d < 1.9? "#702270":
      d < 1.5 ? "#A012A0" :
      "#900190";
    /*(
       return     d < 11? "#9CFF9C":
            d < 23? "#31FF00":
            d < 35? "#31CF00":
            d < 41? "#FFFF00":
            d < 47? "#FFCF00":
            d < 53? "#FF9A00":
            d < 58? "#FF6464":
            d < 64? "#FF0000":
            d < 70? "#990000":
                "#CE30FF";
  */
    /*
       return     d < 15.4? "#31CF00":
            d < 35.4? "#FFFF00":
            d < 54.4? "#FF9A00":
            d < 150.4? "#FF0000":
            d < 250.4? "#CE00CE":
            d < 350.4? "#990000":
            d < 500.4? "#990000":
                "#990000";
    */

  }

  var legend = L.control({
    position: 'bottomright'
  });

  legend.onAdd = function(map) {

    var div = L.DomUtil.create('div', 'info legend'),
      labels = [],
      grades = [0, 1, 3, 6, 8, 10,
        12, 14, 16, 18, 20,
        25, 30, 35, 40, 50,
        60, 70, 80, 90, 100,
        110, 120, 130, 140, 150
      ];
    //grades = [0,11,23,35,41,47,53,58,64,70];
    // grades = [0,15.4,35.4,54.4,150.4,250.4,350.4,500.4];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
      div.innerHTML += labels.push(
        '<i style="background:' + getColor(grades[i] + 1) + ';">&nbsp;&nbsp;&nbsp;&nbsp;</i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+'));
    }
    div.innerHTML = "<table border=1 bgcolor=\"#ffffff\" cellspacing=0 cellpadding=5><tr><td bgcolor=\"#ffffff\"><font size=\"-1\">" + labels.join('<br>') + "</font></td></tr></table>";

    return div;
  };

  legend.addTo(map);