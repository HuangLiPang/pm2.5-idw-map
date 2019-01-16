/*
 (c) 2016, Manuel Bär (www.geonet.ch)
 Leaflet.idw, a tiny and fast inverse distance weighting plugin for Leaflet.
 Largely based on the source code of Leaflet.heat by Vladimir Agafonkin (c) 2014
 https://github.com/Leaflet/Leaflet.heat
 version: 0.0.2
*/
! function() {
  "use strict";

  function simpleidw(canvas) {
    if (!(this instanceof simpleidw)) return new simpleidw(canvas);

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._max = 1;
    this._data = [];
  }

  simpleidw.prototype = {

      defaultCellSize: 25,

      Gradients: {
        default: {
          0.001: "#FFFFFF",
          0.01: "#CCCCFF",
          0.03: "#BBBBEE",
          0.06: "#AAAADD",
          0.08: "#9999CC",
          0.10: "#8888BB",

          0.12: "#90FA96",
          0.14: "#82EA64",
          0.16: "#66DA36",
          0.18: "#50CA2C",
          0.20: "#4ABA26",

          0.25: "#FAFA5D",
          0.30: "#EAEA46",
          0.35: "#DADA4D",
          0.40: "#CACA42",
          0.50: "#BABA36",

          0.6: "#FF7777",
          0.7: "#EE6666",
          0.8: "#DD5555",
          0.9: "#CC4444",
          1.0: "#BB3333",

          1.1: "#E046E0",
          1.2: "#D03DD0",
          1.3: "#C032C0",
          1.4: "#B026B0",
          1.5: "#A01DA0"
        }
      },

      data: function(data) {
        this._data = data;
        return this;
      },

      max: function(max) {
        this._max = max;
        return this;
      },

      add: function(point) {
        this._data.push(point);
        return this;
      },

      clear: function() {
        this._data = [];
        return this;
      },

      cellSize: function(r) {
        // create a grayscale blurred cell image that we'll use for drawing points
        var cell = this._cell = document.createElement("canvas"),
          ctx = cell.getContext('2d');
        this._r = r;

        cell.width = cell.height = r;

        ctx.beginPath();
        ctx.rect(0, 0, r, r);
        ctx.fill();
        ctx.closePath();

        return this;
      },

      resize: function() {
        this._width = this._canvas.width;
        this._height = this._canvas.height;
      },

      gradient: function(grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = document.createElement("canvas"),
          ctx = canvas.getContext('2d'),
          gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
          gradient.addColorStop(+i / 2, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
      },

      draw: function(opacity, dataType) {
        if (!this._cell) this.cellSize(this.defaultCellSize);
        if (!this._grad) {
          // dataType: 2 => pm2.5, 3 => temperature, 4 => humidity
          switch(dataType) {
            case 2:
              this.gradient(this.Gradients["2"]);
              break;
            case 3:
              this.gradient(this.Gradients["3"]);
              break;
            case 4:
              this.gradient(this.Gradients["4"]);
              break;
            default:
              this.gradient(this.Gradients.default);
          }
        }

        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);
        // draw a grayscale idwmap by putting a cell at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
          p = this._data[i];
          ctx.globalAlpha = p[2] / this._max;
          ctx.drawImage(this._cell, p[0] - this._r, p[1] - this._r);
        }

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);

        this._colorize(colored.data, this._grad, opacity);
        ctx.putImageData(colored, 0, 0);


        return this;
      },

      _colorize: function(pixels, gradient, opacity) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
          j = pixels[i + 3] * 4;

          pixels[i] = gradient[j];
          pixels[i + 1] = gradient[j + 1];
          pixels[i + 2] = gradient[j + 2];
          pixels[i + 3] = opacity * 256;
        }
      }
    },
    window.simpleidw = simpleidw;
}(),

L.IdwLayer = (L.Layer ? L.Layer : L.Class).extend({

  //    options: {
  //        opacity: 0.5,
  //        maxZoom: 18,
  //        cellSize: 1,
  //        exp: 2,
  //        max: 2
  //    }

  initialize: function(latlngs, dataType, gradient, options) {
    this._latlngs = latlngs;
    // dataType: 2 => pm2.5, 3 => temperature, 4 => humidity
    this.dataType = undefined ? 2 : dataType;
    this.gradient = gradient;
    L.setOptions(this, options);
  },

  setLatLngs: function(latlngs) {
    this._latlngs = latlngs;
    return this.redraw();
  },

  addLatLng: function(latlng) {
    this._latlngs.push(latlng);
    return this.redraw();
  },

  setOptions: function(options) {
    L.setOptions(this, options);
    if (this._idw) {
      this._updateOptions();
    }
    return this.redraw();
  },

  redraw: function() {
    if (this._idw && !this._frame && !this._map._animating) {
      this._frame = L.Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  },

  onAdd: function(map) {
    this._map = map;

    if (!this._canvas) {
      this._initCanvas();
    }

    map._panes.overlayPane.appendChild(this._canvas);

    map.on('moveend', this._reset, this);

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },

  onRemove: function(map) {
    map.getPanes().overlayPane.removeChild(this._canvas);

    map.off('moveend', this._reset, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  },

  addTo: function(map) {
    map.addLayer(this);
    return this;
  },

  _initCanvas: function() {
    var canvas = this._canvas = L.DomUtil.create('canvas', 'leaflet-idwmap-layer leaflet-layer');

    var originProp = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);
    canvas.style[originProp] = '50% 50%';

    var size = this._map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

    this._idw = simpleidw(canvas);
    this._updateOptions();
  },

  _updateOptions: function() {
    this._idw.cellSize(this.options.cellSize || this._idw.defaultCellSize);

    if (this.options.gradient) {
      this._idw.gradient(this.options.gradient);
    }
    if (this.options.max) {
      this._idw.max(this.options.max);
    }
  },

  _reset: function() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    var size = this._map.getSize();

    if (this._idw._width !== size.x) {
      this._canvas.width = this._idw._width = size.x;
    }
    if (this._idw._height !== size.y) {
      this._canvas.height = this._idw._height = size.y;
    }

    this._redraw();
  },

  _redraw: function() {
    if (!this._map) {
      return;
    }
    var data = [],
      // r is cell size
      r = this._idw._r,
      // screen size: o.Point {x: 1156, y: 983}
      size = this._map.getSize(),
      // bounds of pixel coordinate on the screen
      bounds = new L.Bounds(
        L.point([-r, -r]),
        size.add([r, r])
      ),
      // exp used for weighting, 1 by default
      // exponential distances of the n data points to the estimated point
      exp = this.options.exp === undefined ? 1 : this.options.exp,
      // maximum AQI point values, 1.0 by default
      max = this.options.max === undefined ? 1 : this.options.max,
      maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom,
      cellCen = r / 2,
      // number of cells on the x-axis of the screen
      nCellX = Math.ceil((bounds.max.x - bounds.min.x) / r) + 1,
      // number of cells on the y-axis of the screen
      nCellY = Math.ceil((bounds.max.y - bounds.min.y) / r) + 1,
      numberOfData = this._latlngs.length;

    console.time('process ' + this._latlngs.length);

    // -- cclljj
    // left top lat lon coordinate of the screen
    var leftTop = map.containerPointToLatLng([0, 0]),
      // right bottom lat lon coordinate of the screen
      rightBottom = map.containerPointToLatLng([map.getSize().x, map.getSize().y]),
      // km per pixel on x-axis
      offsetX = Math.abs(leftTop.lng - rightBottom.lng) * 111.32 / map.getSize().x,
      // km per pixel on y-axis
      offsetY = Math.abs(leftTop.lat - rightBottom.lat) * 110.574 / map.getSize().y,
      // station effective range in km
      station_range = 10;

    // Inverse Distance Weighting (IDW)
    //       Σ (1 / (di ^ p)) * vi
    // V = -------------------------
    //          Σ (1 / (di ^ p))
    // Reference:
    // http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml
    
    // cellsn = Σ (1 / (di ^ p)) * vi
    // cellsd = Σ (1 / (di ^ p))
    var cellsn = new Array(nCellY),
      cellsd = new Array(nCellY);
    // initialize cellsn and cellsd to 0
    for (var i = 0; i < nCellY; i++) {
      cellsn[i] = new Array(nCellX);
      cellsd[i] = new Array(nCellX);
      for (var j = 0; j < nCellX; j++) {
        cellsn[i][j] = 0;
        cellsd[i][j] = 0;
      }
    }

    for (var k = 0; k < numberOfData; k++) {
      // p is the pixel coordinate of _latlngs[k] on the screen
      var p = this._map.latLngToContainerPoint(L.latLng(this._latlngs[k][0], this._latlngs[k][1])),
        // left pixel coordinate of the cell
        x1 = p.x - station_range / offsetX,
        // right
        x2 = p.x + station_range / offsetX,
        // top
        y1 = p.y - station_range / offsetY,
        // bottom
        y2 = p.y + station_range / offsetY;

      // cell coordinate
      x1 = Math.round(x1 / r + 0.5);
      x2 = Math.ceil(x2 / r - 0.5);
      y1 = Math.round(y1 / r + 0.5);
      y2 = Math.ceil(y2 / r - 0.5);

      // check if x1, x2, y1, y2 out of cellsn, cellsd bounds
      if (x1 < 0.0) {
        x1 = 0.0;
      }
      if (x2 < 0.0) {
        continue;
      }
      if (x1 >= nCellX) {
        continue;
      }
      if (x2 >= nCellX) {
        x2 = nCellX - 1;
      }

      if (y1 < 0.0) {
        y1 = 0.0;
      }
      if (y2 < 0.0) {
        continue;
      }
      if (y1 >= nCellY) {
        continue;
      }
      if (y2 >= nCellY) {
        y2 = nCellY - 1;
      }
      // L.marker([this._latlngs[k][0], this._latlngs[k][1]]).addTo(map);
      // calculate every point effect by the station
      for (var j = x1; j <= x2; j++) {
        for (var i = y1; i <= y2; i++) {
          if (cellsd[i][j] < 0.0) {
            // center of the cell
            // cellsd = -1
            continue;
          }

          // pixel coordinate of _latlon[k]
          // _latlon = [lat, lon, AQI]
          var p = this._map.latLngToContainerPoint([this._latlngs[k][0], this._latlngs[k][1]]);

          // estimated point pixel coordinate
          var cp = L.point((j * r - cellCen), (i * r - cellCen));

          // pixel distance
          var distInPixels = cp.distanceTo(p);

          // distance in km on x-axis
          var LJ_x = (p.x - cp.x) * offsetX;
          // distance in km on y-axis
          var LJ_y = (p.y - cp.y) * offsetY;
          var LJ_dist = Math.sqrt(LJ_x * LJ_x + LJ_y * LJ_y);
          if (LJ_dist > station_range) {
            // point out of effective range
            continue;
          }

          // IDW default value for Taiwan
          // PM2.5 is 10.0
          // Temperature is 20.0
          // Hunidity is 70.0
          var defaultVal = 0.0;
          if(this.dataType === 2) defaultVal = 1.0;
          else if(this.dataType === 3) defaultVal = 20.0;
          else if(this.dataType === 4) defaultVal = 70.0;

          // IDW value
          var val = defaultVal;
          if(this._latlngs[k].alt !== undefined) val = this._latlngs[k].alt;
          else if(this._latlngs[k][this.dataType] !== undefined) val = +this._latlngs[k][this.dataType];

          // if the value is less than 0.0,
          // the sensor is broken
          // set the value to default value
          if(this.dataType === 2 && val < 0.0) val = defaultVal;
          if(this.dataType === 3 && (val < -20.0 || val > 50.0)) val = defaultVal;

          if (distInPixels === 0.0) {
            // cell center fills in original value
            cellsn[i][j] = val;
            cellsd[i][j] = -1.0;
          } else {
            var distInPixelsExp = Math.pow(distInPixels, exp);
            cellsn[i][j] += (val / distInPixelsExp);
            cellsd[i][j] += (1.0 / distInPixelsExp);
            //console.log(val);
          }
        }
      }
    }

    for (var i = 0; i < nCellY; i++) {
      for (var j = 0; j < nCellX; j++) {
        if (cellsd[i][j] < 0.0) {
          cellsd[i][j] = 1.0;
        }
        var interpolVal = 0.0
        if (cellsd[i][j] === 0.0) {
          interpolVal = 0.0;
        } else {
          interpolVal = cellsn[i][j] / cellsd[i][j];
        }
        // IDW value
        var cell = [j * r, i * r, interpolVal];

        if (cell !== undefined && interpolVal !== 0.0) {
          data.push([
            Math.round(cell[0]),
            Math.round(cell[1]),
            Math.min(cell[2], max)
          ]);
        }
      }
    }

    console.timeEnd('process ' + this._latlngs.length);
    console.time('draw ' + data.length);
    // add gradient to simpleidw
    simpleidw.prototype.Gradients[this.dataType] = this.gradient;
    
    this._idw.data(data).draw(this.options.opacity, this.dataType);
    console.timeEnd('draw ' + data.length);
    this._frame = null;
  },

  _animateZoom: function(e) {
    var scale = this._map.getZoomScale(e.zoom),
      offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

    if (L.DomUtil.setTransform) {
      L.DomUtil.setTransform(this._canvas, offset, scale);

    } else {
      this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
    }
  }
});

L.idwLayer = function(latlngs, dataType, gradient, options) {
  return new L.IdwLayer(latlngs, dataType, gradient,options);
};