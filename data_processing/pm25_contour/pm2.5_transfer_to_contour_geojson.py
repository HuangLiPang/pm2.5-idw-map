#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on 2018 Apr.

@author: huanglipang

Dependencies:
  python          3.6.4
  numpy           1.14.0
  matplotlib      2.1.2
  geojsoncontour  0.3.0
"""

import numpy
import matplotlib
# use("Agg") for console execution
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import geojsoncontour
import json
import time
from math import sqrt, pow, log
import config
import logging
import logging.config
import logging_config
from logging_config import RotatingFileNameHandler

# parameters & settings ------------------------------
DIR = config.DIR
DATA_PATH = config.CONTOUR["DATA_PATH"]
# lat lon boundary
boundaries = config.CONTOUR["BOUNDARY"]
# grid size
# a cell is about 
# 1 degree lon = 111.320 km
# 1 degree lat = 110.574 km
precise = config.CONTOUR["PRECISE"]
logPrecise = int(log(precise, 10)) + 1
grid_size = 1.0 / precise
# effective range in KM
effectiveRange = config.CONTOUR["EFFECTIVE_RANGE"]
# exponential factor for calculating idw value
expFactor = config.CONTOUR["EXP_FACTOR"]
# ------------------------------ parameters & settings

# load config file
logging.config.dictConfig(logging_config.LOGGING)

# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath)
logger.addHandler(RotatingFileNameHandler(__file__, "./log"))

start = time.time()
logger.info("pm 2.5 contour start")

##
### Create lat and lon vectors and grid data ###
##

try:
  # loading data points [lat, lon, value]
  data = json.load(open(DATA_PATH), parse_float = float)
except Exception as err:
  logger.error("load data.json error.")
  logger.error(err)

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
latDiff = int(boundaries["lat"]["max"] - boundaries["lat"]["min"])
lonDiff = int(boundaries["lon"]["max"] - boundaries["lon"]["min"])

lonCellLength = lonDiff * precise
latCellLength = latDiff * precise

# numpy.zeros returns a new array of given shape and type, filled with zeros.
# cell[lat][lon]
# cell summation numerator
cellSN = numpy.zeros((latCellLength, lonCellLength),\
                     dtype=float, order='C')
# cell summation denominator
cellSD = numpy.zeros((latCellLength, lonCellLength),\
                     dtype=float, order='C')

pm25Value = numpy.zeros((latCellLength, lonCellLength),\
                     dtype=float, order='C')
temp = time.time()
logger.info("idw calculation start: %f" % (temp - start))

for point in data["points"]:
  # point[lat][lon][value]
  # point is the center of the cell
  lat = round(point[0], logPrecise)
  lon = round(point[1], logPrecise)
  value = float(point[2])
  
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
    # y represents latitude
    # x represents longitude
    for y in range(y1, y2):
      for x in range(x1, x2):
        if(cellSD[y][x] < 0.0):
          # center of the cell
          # which has real pm2.5 value
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

temp = time.time()
logger.info("idw calculation complete: %f" % (temp - start))
    
for y in range(0, latCellLength):
  for x in range(0, lonCellLength):
    if(cellSD[y][x] < 0):
      cellSD[y][x] = 1
    interpolateValue = 0
    if(cellSN[y][x] != 0):
      interpolateValue = cellSN[y][x] / cellSD[y][x]
    
    # calculate pm2.5 value
    pm25Value[y][x] = interpolateValue
temp = time.time()
logger.info("pm2.5 value complete: %f" % (temp - start))

##
### Create a contour plot from grid (lat, lon) data ###
##

# Create a new figure
figure = plt.figure()

# only one figure show on console
ax = figure.add_subplot(111)

n_contours = {
  # "1": 150,
  # "2": 75,
  # "3": 50,
  "5": 30,
  "10": 15
}

# numpy.linspace(start, stop, num=50, endpoint=True, retstep=False, dtype=None)
# Return evenly spaced numbers over a specified interval.
# num = number of samples to generate
contourIntervals = {
  # "1": numpy.linspace(start = 0, stop = 150, num = n_contours["1"]),
  # "2": numpy.linspace(start = 0, stop = 150, num = n_contours["2"]),
  # "3": numpy.linspace(start = 0, stop = 150, num = n_contours["3"]),
  "5": numpy.linspace(start = 0, stop = 150, num = n_contours["5"]),
  "10": numpy.linspace(start = 0, stop = 150, num = n_contours["10"])
}

# plot contour
for interval in contourIntervals:
  contour_grey = ax.contour(lonRange, latRange, pm25Value,\
    levels = contourIntervals[interval],\
    cmap = None,\
    colors = "black"\
  )
  ##
  ### Convert matplotlib contour to geojson ###
  ##
  geojsoncontour.contour_to_geojson(
    contour = contour_grey,
    geojson_filepath = DIR + 'data/pm25Contour_grey_' + interval + '.geojson',
    min_angle_deg = 10.0,
    ndigits = 3,
    stroke_width = 2,
    unit = "μg/m^3"
  )

end = time.time()
logger.info("geojson complete: %f" % (end - start))