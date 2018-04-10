#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on 2018 Apr.

@author: huanglipang
"""

import numpy
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import geojsoncontour
import json
from math import sqrt, pow, log

# calculate idw
def idwCalculation(x1, x2, y1, y2, cellSN, cellSD, expFactor):
  for y in range(y1, y2):
    for x in range(x1, x2):
      if(cellSD[y][x] < 0.0):
        # center of the cell
        # cellSD = -1
        continue
      
      # calculate distance
      distance = sqrt(pow(((x - lon) / precise * 111.320), 2) +\
                pow(((y - lat) / precise * 110.574), 2))
      if(distance > effectiveRange):
        continue
      
      if distance > 0:
        distanceExp = pow(distance, expFactor)
        cellSN[y][x] += value / distanceExp
        cellSD[y][x] += 1 / distanceExp

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
logPrecise = int(log(precise, 10)) + 1
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

lonCellLength = lonDiff * precise
latCellLength = latDiff * precise
# cell summation numerator
cellSN = numpy.zeros((latCellLength, lonCellLength),\
                     dtype=float, order='C')
# cell summation denominator
cellSD = numpy.zeros((latCellLength, lonCellLength),\
                     dtype=float, order='C')

pm25Value = numpy.zeros((latCellLength, lonCellLength),\
                     dtype=float, order='C')

for point in points:
  # point[lat][lon][value]
  # point is the center of the cell
  lat = round(point[0], logPrecise)
  lon = round(point[1], logPrecise)
  value = point[2]
  
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
    if(x2 < 0):
      continue
    if(x1 >= lonCellLength):
      continue
    if(y2 < 0):
      continue
    if(y1 >= latCellLength):
      continue
    
    if(x1 < 0):
      x1 = 0
    if(x2 >= lonCellLength):
      x2 = lonDiff * precise - 1
    if(y1 < 0):
      y1 = 0
    if(y2 >= latCellLength):
      y2 = latDiff * precise - 1
    
    # transfer lat lon into index
    lat = int((lat - boundaries["lat"]["min"]) * precise)
    lon = int((lon - boundaries["lon"]["min"]) * precise)
    # set cell center values
    cellSN[lat][lon] = value
    cellSD[lat][lon] = -1
    
    # calculate idw
    idwCalculation(x1, x2, y1, y2, cellSN, cellSD, expFactor)
    
for y in range(0, latCellLength):
  for x in range(0, lonCellLength):
    if(cellSD[y][x] < 0):
      cellSD[y][x] = 1
    interpolateValue = 0
    if(cellSN[y][x] != 0):
      interpolateValue = cellSN[y][x] / cellSD[y][x]
    
    # calculate pm2.5 value
    pm25Value[y][x] = interpolateValue

##
### Create a contour plot plot from grid (lat, lon) data ###
##

# color map for pm2.5

pm25Colors = {
  'red': (
    (0.0000, 0.000, 1.000), # 0
    (0.0067, 1.000, 0.800), # 1
    (0.0200, 0.800, 0.733), # 3
    (0.0400, 0.733, 0.667), # 6
    (0.0536, 0.667, 0.600), # 8
    (0.0667, 0.600, 0.533), # 10
    
    (0.0800, 0.566, 0.566), # 12
    (0.0938, 0.566, 0.510), # 14
    (0.1072, 0.510, 0.400), # 16
    (0.1206, 0.400, 0.314), # 18
    (0.1340, 0.314, 0.290), # 20
    
    (0.1675, 0.980, 0.980), # 25
    (0.2000, 0.980, 0.918), # 30
    (0.2345, 0.918, 0.855), # 35
    (0.2680, 0.855, 0.792), # 40
    (0.3350, 0.792, 0.729), # 50
    
    (0.4000, 0.100, 0.100), # 60
    (0.4690, 0.100, 0.933), # 70
    (0.5360, 0.933, 0.867), # 80
    (0.6000, 0.867, 0.800), # 90
    (0.6670, 0.800, 0.733), # 100
    
    (0.7370, 0.878, 0.878), # 110
    (0.8000, 0.878, 0.816), # 120
    (0.8710, 0.816, 0.753), # 130
    (0.9380, 0.753, 0.690), # 140
    (1.0000, 0.690, 0.627)  # 150
  ), 

  'green': (
    (0.0000, 0.000, 1.000), # 0
    (0.0067, 1.000, 0.800), # 1
    (0.0200, 0.800, 0.733), # 3
    (0.0400, 0.733, 0.667), # 6
    (0.0536, 0.667, 0.600), # 8
    (0.0667, 0.600, 0.533), # 10

    (0.0800, 0.980, 0.980), # 12
    (0.0938, 0.980, 0.918), # 14
    (0.1072, 0.918, 0.855), # 16
    (0.1206, 0.855, 0.792), # 18
    (0.1340, 0.792, 0.729), # 20

    (0.1675, 0.980, 0.980), # 25
    (0.2000, 0.980, 0.918), # 30
    (0.2345, 0.918, 0.855), # 35
    (0.2680, 0.855, 0.792), # 40
    (0.3350, 0.792, 0.729), # 50

    (0.4000, 0.467, 0.467), # 60
    (0.4690, 0.467, 0.400), # 70
    (0.5360, 0.400, 0.333), # 80
    (0.6000, 0.333, 0.267), # 90
    (0.6670, 0.267, 0.200), # 100

    (0.7370, 0.337, 0.337), # 110
    (0.8000, 0.337, 0.271), # 120
    (0.8710, 0.271, 0.204), # 130
    (0.9380, 0.204, 0.137), # 140
    (1.0000, 0.137, 0.071)  # 150
  ), 

  'blue': (
    (0.0000, 0.000, 1.000), # 0
    (0.0067, 1.000, 1.000), # 1
    (0.0200, 1.000, 0.933), # 3
    (0.0400, 0.933, 0.867), # 6
    (0.0536, 0.867, 0.800), # 8
    (0.0667, 0.800, 0.733), # 10

    (0.0800, 0.588, 0.588), # 12
    (0.0938, 0.588, 0.392), # 14
    (0.1072, 0.392, 0.212), # 16
    (0.1206, 0.212, 0.173), # 18
    (0.1340, 0.173, 0.149), # 20

    (0.1675, 0.365, 0.365), # 25
    (0.2000, 0.365, 0.275), # 30
    (0.2345, 0.275, 0.302), # 35
    (0.2680, 0.302, 0.259), # 40
    (0.3350, 0.259, 0.212), # 50

    (0.4000, 0.467, 0.467), # 60
    (0.4690, 0.467, 0.400), # 70
    (0.5360, 0.400, 0.333), # 80
    (0.6000, 0.333, 0.267), # 90
    (0.6670, 0.267, 0.200), # 100

    (0.7370, 0.878, 0.878), # 110
    (0.8000, 0.878, 0.816), # 120
    (0.8710, 0.816, 0.753), # 130
    (0.9380, 0.753, 0.690), # 140
    (1.0000, 0.690, 0.627)  # 150
  )
}
colorMapName = "pm2.5 color map"
pm25ColorMap = LinearSegmentedColormap(colorMapName, pm25Colors)

# Create a new figure
figure = plt.figure()

# only one figure show on console
ax = figure.add_subplot(111)

# numpy.linspace(start, stop, num=50, endpoint=True, retstep=False, dtype=None)
# Return evenly spaced numbers over a specified interval.
# num = number of samples to generate
n_contours = {
  "1": 150,
  "2": 75,
  "3": 50,
  "5": 30,
  "10": 15
}

contourIntervals = {
  "1": numpy.linspace(start = 0, stop = 150, num = n_contours["1"]),
  "2": numpy.linspace(start = 0, stop = 150, num = n_contours["2"]),
  "3": numpy.linspace(start = 0, stop = 150, num = n_contours["3"]),
  "5": numpy.linspace(start = 0, stop = 150, num = n_contours["5"]),
  "10": numpy.linspace(start = 0, stop = 150, num = n_contours["10"])
}
# plot contour

for interval in contourIntervals:
  contour_color = ax.contour(lonRange, latRange, pm25Value,\
                     levels = contourIntervals[interval], cmap = pm25ColorMap)

  contour_grey = ax.contour(lonRange, latRange, pm25Value,\
                     levels = contourIntervals[interval], cmap = None, colors = 'grey')

  contour_greyscale = ax.contour(lonRange, latRange, pm25Value,\
                     levels = contourIntervals[interval], cmap = plt.cm.binary)

  ##
  ### Convert matplotlib contour to geojson ###
  ##

  geojsoncontour.contour_to_geojson(
    contour = contour_color,
    geojson_filepath = '../../pm25Contour_color_' + interval + '.geojson',
    min_angle_deg = 10.0,
    ndigits = 3,
    stroke_width = 2,
    unit = 'μg/m^3'
  )

  geojsoncontour.contour_to_geojson(
    contour = contour_grey,
    geojson_filepath = '../../pm25Contour_grey_' + interval + '.geojson',
    min_angle_deg = 10.0,
    ndigits = 3,
    stroke_width = 2,
    unit = 'μg/m^3'
  )
  
  geojsoncontour.contour_to_geojson(
    contour = contour_greyscale,
    geojson_filepath = '../../pm25Contour_greyscale_' + interval + '.geojson',
    min_angle_deg = 10.0,
    ndigits = 3,
    stroke_width = 2,
    unit = 'μg/m^3'
  )
