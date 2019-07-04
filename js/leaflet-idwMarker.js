"use strict";
L.IdwMarker = L.CircleMarker.extend({
  options: {
    range: 10.0,
    // [[dataType, min]]
    dataOptions: [[2, 0.0]],
    p: 2
    // points: [[lat, lon, value]]
  },
  getIDW: function() {
    let numberOfDataType = this.options.dataOptions.length;
    let IDWValues = [[this._latlng.lat, this._latlng.lng]];
    for(let i = 0; i < numberOfDataType; i++) {
      IDWValues.push(this._IDW(i));
    }
    return IDWValues;
  },
  _filter: function(dataOptionIndex) {
    return this.options.points[dataOptionIndex].filter(point => {
      let coordinate = new L.latLng(point[0], point[1]);
      let distance = coordinate.distanceTo(this._latlng) / 1000.0;
      return distance < this.options.ranges[dataOptionIndex];
    });
  },
  _IDW: function(dataOptionIndex) {
    let min = this.options.dataOptions[dataOptionIndex][1] || 0.0;
    let dataType = this.options.dataOptions[dataOptionIndex][0] || 2;
    let p = this.options.p;
    let cellsn = 0.0;
    let cellsd = 0.0;
    let inCell = this._filter(dataOptionIndex);
    // Inverse Distance Weighting (IDW)
    //       Σ (1 / (di ^ p)) * vi
    // V = -------------------------
    //          Σ (1 / (di ^ p))
    // Reference:
    // http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml
    
    // cellsn = Σ (1 / (di ^ p)) * vi
    // cellsd = Σ (1 / (di ^ p))
    if(inCell.length === 0) return "N/A";
    for (let i = inCell.length - 1; i >= 0; i--) {
      let destCoor = new L.latLng(inCell[i][0], inCell[i][1]);
      let distance = destCoor.distanceTo(this._latlng) / 1000.0;
      // A station locates here
      if(distance === 0.0) {
        return inCell[i][dataType];
      }
      let distanceRev = 1.0 / Math.pow(distance, p);
      if(distanceRev !== Infinity) {
        if(inCell[i][dataType] >= min) {
          cellsn += distanceRev * inCell[i][dataType];
          cellsd += distanceRev;
        }
      }
    }
    return Math.round(cellsn / cellsd * 10.0) / 10.0;
  }
});
L.idwMarker = function(latlng, options) {
  return new L.IdwMarker(latlng, options);
};