import numpy
import matplotlib.pyplot as plt
import geojsoncontour
import json
from math import sqrt, pow

##
### Create lat and lon vectors and grid data ###
##

# loading data points [lat, lon, value]
data = json.load(open('../../pm25.json'))
points = data['points']

# lat lon boundary
boundaries = {
    "lat": {"min": 21.0, "max": 26.0},
    "lon": {"min": 119.0, "max": 123.0}
}

# grid size
# a cell is about 
# 1 degree lon = 111.320 km
# 1 degree lat = 110.574 km
precise = 1000
logPrecise = 3
grid_size = 1.0 / precise
# effective range in KM
effectiveRange = 10
# exponential factor for calculating idw value
expFactor = 2

# numpy.arange(start, stop, step)
# numpy.arange(3, 7, 2) > [3, 5]
lonRange = numpy.arange(boundaries["lon"]["min"],\
                        boundaries["lon"]["max"], grid_size)
latRange = numpy.arange(boundaries["lat"]["min"],\
                        boundaries["lat"]["max"], grid_size)

# Inverse Distance Weighting (IDW)
#       Σ (1 / (di ^ p)) * vi
# V = -------------------------
#          Σ (1 / (di ^ p))
# Reference:
# http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml

# numpy.zeros returns a new array of given shape and type, filled with zeros.
# cell[lat][lon]
latDiff = int(boundaries["lat"]["max"] - boundaries["lat"]["min"])
lonDiff = int(boundaries["lon"]["max"] - boundaries["lon"]["min"])
# cell summation numerator
cellSN = numpy.zeros((latDiff * precise, lonDiff * precise),\
                     dtype=float, order='C')
# cell summation denominator
cellSD = numpy.zeros((latDiff * precise, lonDiff * precise),\
                     dtype=float, order='C')

pm25Value = numpy.zeros((latDiff * precise, lonDiff * precise),\
                     dtype=float, order='C')
# Return coordinate matrices from coordinate vectors.
#X, Y = numpy.meshgrid(lonRange, latRange)

maxPm25Value = 0.0

for point in points:
  # point[lat][lon][value]
  # point is the center of the cell
  lat = round(point[0], logPrecise)
  lon = round(point[1], logPrecise)
  value = point[2]
  
  if(value > maxPm25Value):
    maxPm25Value = value
  
  if(lat >= boundaries["lat"]["min"] and lat < boundaries["lat"]["max"] and \
     lon >= boundaries["lon"]["min"] and lon < boundaries["lon"]["max"]):
    
    # calculate boundary coordinate in cellSN and cellSD
    # boundary of cell in lat lon
    x1 = lon - effectiveRange / 111.320
    x2 = lon + effectiveRange / 111.320
    y1 = lat - effectiveRange / 110.574
    y2 = lat + effectiveRange / 110.574
    
    # boundary of cell in cellSN cellSD index
    x1 = int(round(x1 - boundaries["lon"]["min"], logPrecise) * precise)
    x2 = int(round(x2 - boundaries["lon"]["min"], logPrecise) * precise)
    y1 = int(round(y1 - boundaries["lat"]["min"], logPrecise) * precise)
    y2 = int(round(y2 - boundaries["lat"]["min"], logPrecise) * precise)
    
    # check x1, x2, y1, y2 in the index boundaries
    if(x1 < 0):
      x1 = 0
    if(x2 < 0):
      continue
    if(x1 >= lonDiff * precise):
      continue
    if(x2 >= lonDiff * precise):
      x2 = lonDiff * precise - 1
    
    if(y1 < 0):
      y1 = 0
    if(y2 < 0):
      continue
    if(y1 >= latDiff * precise):
      continue
    if(y2 >= latDiff * precise):
      y2 = latDiff * precise - 1
    
    # transfer lat lon into index
    lat = int((lat - boundaries["lat"]["min"]) * precise)
    lon = int((lon - boundaries["lon"]["min"]) * precise)
    
    # calculate distance
    for y in range(y1, y2):
      for x in range(x1, x2):
        if(cellSD[y][x] < 0.0):
          # center of the cell
          # cellSD = -1
          continue

        distance = sqrt(pow(((x - lon) / precise * 111.320), 2) +\
                  pow(((y - lat) / precise * 110.574), 2))
        if(distance > effectiveRange):
          continue
        
        if distance == 0:
          cellSN[y][x] = value
          cellSD[y][x] = -1
        else:
          distanceExp = pow(distance, expFactor)
          cellSN[y][x] += value / distanceExp
          cellSD[y][x] += 1 / distanceExp
    
for y in range(0, latDiff * precise):
  for x in range(0, lonDiff * precise):
    if(cellSD[y][x] < 0):
      cellSD[y][x] = 1
    interpolateValue = 0
    if(cellSN[y][x] != 0):
      interpolateValue = cellSN[y][x] / cellSD[y][x]
    
    # calculate pm2.5 value
    pm25Value[y][x] = interpolateValue

# numpy.linspace(start, stop, num=50, endpoint=True, retstep=False, dtype=None)
# Return evenly spaced numbers over a specified interval.
# num = number of samples to generate
n_contours = 40
contourIntervals = numpy.linspace(start = 0, stop = maxPm25Value + 10, num = n_contours)

##
### Create a contour plot plot from grid (lat, lon) data ###
##

# Create a new figure
figure = plt.figure()

# only one figure show on console
ax = figure.add_subplot(111)

# plot contour
contour = ax.contour(lonRange, latRange, pm25Value,\
                     levels = contourIntervals, cmap = plt.cm.jet)

##
### Convert matplotlib contourf to geojson ###
##

geojsoncontour.contour_to_geojson(
    contour = contour,
    geojson_filepath = '../../pm25Contour.geojson',
    min_angle_deg = 10.0,
    ndigits = 3,
    unit = 'μg/m^3'
)
