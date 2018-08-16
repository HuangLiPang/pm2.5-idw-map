# PM2.5-IDW-Map

An PM2.5 Inverse Distance Weighting (IDW) map using [Leaflet](https://leafletjs.com/) (v0.7.7).

PM2.5 data source
---
Data source is from [PM2.5 Open Data Portal](https://pm25.lass-net.org/).

Website
---
[PM2.5-IDW-Map](https://pm25.lass-net.org/GIS/IDW/)

Inverse Distance Weighting (IDW)
---
[Reference](http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml)

```
       Σ (1 / (di ^ p)) * vi
 V = -------------------------
          Σ (1 / (di ^ p))
```

Libraries
---
The map is using [Leaflet](https://leafletks.com/) and IDW is edited from [IDW](http://www.geonet.ch/leaflet-idw/). The PM2.5 contour is made from [contourgeojson](https://github.com/bartromgens/geojsoncontour).
