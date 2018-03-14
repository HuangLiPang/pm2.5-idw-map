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
        //this._max = 2;
        this._data = [];
    }

    simpleidw.prototype = {

            defaultCellSize: 25,

            defaultGradient: {
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
                // 0.25: "#3A781C",

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
                //2.00:        "#701010",

                //1.1: "#F04DF0",
                1.1: "#E046E0",
                //1.3: "#D042D0",
                1.2: "#D03DD0",
                //1.5: "#B036B0",
                1.3: "#C032C0",
                //1.7: "#902D90",
                1.4: "#B026B0",
                //1.9: "#702270",
                1.5: "#A01DA0",
                //          2.0: "#901690",

                /*
        0.00: "#ffffff",
                0.11: "#9cff9c",
                0.23: "#31ff00",
                0.35: "#31cf00",
                0.41: "#FFFF00",
                0.47: "#FFCF00",
                0.53: "#FF9A00",
                0.58: "#FF6464",
                0.64: "#FF0000",
                0.70: "#990000",
                1: "#CE30FF"
    */
                /*
        0.00: "#ffffff",
                0.0154: "#31CF00",
                0.0354: "#FFFF00",
                0.0544: "#FF9A00",
                0.1504: "#FF0000",
                0.2504: "#CE00CE",
                0.3504: "#990000",
                0.5004: "#990000",
                1: "#990000"
    */
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

            draw: function(opacity) {
                if (!this._cell) this.cellSize(this.defaultCellSize);
                if (!this._grad) this.gradient(this.defaultGradient);

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
    //    },

    initialize: function(latlngs, options) {
        this._latlngs = latlngs;
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
            r = this._idw._r,
            size = this._map.getSize(),
            bounds = new L.Bounds(
                L.point([-r, -r]),
                size.add([r, r])),

            exp = this.options.exp === undefined ? 1 : this.options.exp,
            max = this.options.max === undefined ? 1 : this.options.max,
            maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom,
            v = 1,
            cellCen = r / 2,
            grid = [],
            nCellX = Math.ceil((bounds.max.x - bounds.min.x) / r) + 1,
            nCellY = Math.ceil((bounds.max.y - bounds.min.y) / r) + 1,
            panePos = this._map._getMapPanePos(),

            offsetX = 0,
            offsetY = 0,
            i, len, p, cell, x, y, j, len2, k;

        console.time('process ' + this._latlngs.length);

        // -- cclljj
        var rt = map.containerPointToLatLng([0, 0]);
        var lb = map.containerPointToLatLng([map.getSize().x, map.getSize().y]);
        var offset_x = Math.abs(rt.lng - lb.lng) * 111.32 * Math.cos(Math.PI * rt.lat / 180); // map.getSize().x;  // km per map.size unit
        var offset_x = Math.abs(rt.lng - lb.lng) * 111.32 / map.getSize().x; // km per map.size unit

        var offset_y = Math.abs(rt.lat - lb.lat) * 110.574 / map.getSize().y; // km per map.size unit
        var station_range = 10; //km

        var cellsn = new Array(nCellY);
        var cellsd = new Array(nCellY);
        for (var i = 0; i < nCellY; i++) {
            cellsn[i] = new Array(nCellX);
            cellsd[i] = new Array(nCellX);
            for (var j = 0; j < nCellX; j++) {
                cellsn[i][j] = 0;
                cellsd[i][j] = 0;
            }
        }

        for (k = 0, len3 = this._latlngs.length; k < len3; k++) {
            var p = this._map.latLngToContainerPoint(this._latlngs[k]);
            var x1 = p.x - station_range / offset_x;
            var x2 = p.x + station_range / offset_x;
            var y1 = p.y - station_range / offset_y;
            var y2 = p.y + station_range / offset_y;
            x1 = Math.round(x1 / r + 0.5);
            x2 = Math.ceil(x2 / r - 0.5);
            if (x1 < 0) {
                x1 = 0;
            }
            if (x2 < 0) {
                continue;
            }
            if (x1 >= nCellX) {
                continue;
            }
            if (x2 >= nCellX) {
                x2 = nCellX - 1;
            }
            y1 = Math.round(y1 / r + 0.5);
            y2 = Math.ceil(y2 / r - 0.5);
            if (y1 < 0) {
                y1 = 0;
            }
            if (y2 < 0) {
                continue;
            }
            if (y1 >= nCellY) {
                continue;
            }
            if (y2 >= nCellY) {
                y2 = nCellY - 1;
            }

            for (var j = x1; j <= x2; j++) {
                for (var i = y1; i <= y2; i++) {
                    if (cellsd[i][j] < 0) {
                        continue;
                    }

                    var p = this._map.latLngToContainerPoint(this._latlngs[k]);
                    var cp = L.point((j * r - cellCen), (i * r - cellCen));
                    var dist = cp.distanceTo(p);

                    var LJ_x = (p.x - cp.x) * offset_x;
                    var LJ_y = (p.y - cp.y) * offset_y;
                    var LJ_dist = Math.sqrt(LJ_x * LJ_x + LJ_y * LJ_y);
                    if (LJ_dist > station_range) {
                        continue;
                    }

                    var dist2;

                    var val =
                        this._latlngs[k].alt !== undefined ? this._latlngs[k].alt :
                        this._latlngs[k][2] !== undefined ? +this._latlngs[k][2] : 1;

                    if (dist == 0) {
                        cellsn[i][j] = val;
                        cellsd[i][j] = -1;
                    } else {
                        dist2 = Math.pow(dist, exp);
                        cellsn[i][j] += (val / dist2);
                        cellsd[i][j] += (1 / dist2);
                        //console.log(val);
                    }

                }
            }


        }

        for (i = 0, len = nCellY; i < len; i++) {
            for (j = 0, len2 = nCellX; j < len2; j++) {
                if (cellsd[i][j] < 0) {
                    cellsd[i][j] = 1;
                }

                if (cellsd[i][j] == 0) {
                    interpolVal = 0;
                } else {
                    interpolVal = cellsn[i][j] / cellsd[i][j];
                }

                cell = [j * r, i * r, interpolVal];

                if (cell && interpolVal) {
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
        this._idw.data(data).draw(this.options.opacity);
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

L.idwLayer = function(latlngs, options) {
    return new L.IdwLayer(latlngs, options);
};