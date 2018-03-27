import numpy
import matplotlib.pyplot as plt
import geojsoncontour
import json

# Create lat and lon vectors and grid data
data = json.load(open('pm25.json'))
points = data['points']
grid_size = 0.0001
latrange = numpy.arange(20.0, 26.0, grid_size)
lonrange = numpy.arange(120.0, 122.0, grid_size)
X, Y = numpy.meshgrid(lonrange, latrange)
Z = numpy.zeros((60000, 20000))
for point in points:
  lat = round(point[0], 3)
  lon = round(point[1], 3)
  z = point[2]
  if(lat >= 20.0 and lat <= 26.0 and lon >= 120.0 and lon <= 122.0):
    x = int((lat - 20.0) * 100)
    y = int((lon - 120.0) * 100)
    Z[x][y] = z

n_contours = 10
levels = numpy.linspace(start=120, stop=124, num=n_contours)

# Create a contour plot plot from grid (lat, lon) data
figure = plt.figure()
ax = figure.add_subplot(111)
contour = ax.contour(lonrange, latrange, Z, levels=levels, cmap=plt.cm.jet)

# Convert matplotlib contourf to geojson
geojsoncontour.contour_to_geojson(
    contour=contour,
    geojson_filepath='out.geojson',
    min_angle_deg=10.0,
    ndigits=3,
    unit='m'
)
