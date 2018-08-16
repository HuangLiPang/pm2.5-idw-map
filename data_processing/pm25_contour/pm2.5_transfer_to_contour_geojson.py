#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on 2018 Apr.

@author: huanglipang
Discription:
  converting pm2.5 data to contour geojosn using IDW
  
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
# all path are absolute path
DIR = config.DIR
DATA_PATH = config.CONTOUR["DATA_PATH"]
LOG_PATH = config.CONTOUR["LOG_PATH"]
# lat lon boundary
BOUNDARY = config.CONTOUR["BOUNDARY"]
"""
BOUNDARY = {
  "lat": {"min": 21.0, "max": 26.0},
  "lon": {"min": 119.0, "max": 123.0}
}
"""

# PRIECISE of how many division in lenth, e.g. 10, 100, 1000 etc.
PRECISE = config.CONTOUR["PRECISE"]
LOG_PRECISE = int(log(PRECISE, 10)) + 1

# grid size
# a cell of 1 lat * 1 lon
# length of 1 degree lon = 111.320 km
# length of 1 degree lat = 110.574 km
GRID_SIZE = 1.0 / PRECISE
# effective range in KM
EFFECTIVE_RANGE = config.CONTOUR["EFFECTIVE_RANGE"]
# exponential factor for calculating idw value
EXP_FACTOR = config.CONTOUR["EXP_FACTOR"]
# ------------------------------ parameters & settings

# Inverse Distance Weighting (IDW)
#       Σ (1 / (di ^ p)) * vi
# V = -------------------------
#          Σ (1 / (di ^ p))
# Reference:
# http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml

# load config file
logging.config.dictConfig(logging_config.LOGGING)

# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath)
logger.addHandler(RotatingFileNameHandler(__file__, LOG_PATH))

start = time.time()
logger.info("pm2.5 data to contour geojson conversion starts")

### Create lat and lon vectors and grid data
try:
  # loading data points [lat, lon, value]
  data = json.load(open(DATA_PATH), parse_float = float)
except Exception as err:
  logger.error("load data.json error.")
  logger.error(err)

# numpy.arange(start, stop, step)
# numpy.arange(3, 7, 2) > [3, 5]
lonRange = numpy.arange(BOUNDARY["lon"]["min"],\
                        BOUNDARY["lon"]["max"], GRID_SIZE)
latRange = numpy.arange(BOUNDARY["lat"]["min"],\
                        BOUNDARY["lat"]["max"], GRID_SIZE)

latDiff = int(BOUNDARY["lat"]["max"] - BOUNDARY["lat"]["min"])
lonDiff = int(BOUNDARY["lon"]["max"] - BOUNDARY["lon"]["min"])

lonCellLength = lonDiff * PRECISE
latCellLength = latDiff * PRECISE

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
logger.info("idw calculation starts: %f" % (temp - start))

for point in data["points"]:
  # point[lat][lon][value]
  # point is the center of the cell
  lat = round(point[0], LOG_PRECISE)
  lon = round(point[1], LOG_PRECISE)
  value = float(point[2])
  
  if(lat >= BOUNDARY["lat"]["min"] and lat < BOUNDARY["lat"]["max"] and \
     lon >= BOUNDARY["lon"]["min"] and lon < BOUNDARY["lon"]["max"]):
    
    # calculate boundary coordinate in cellSN and cellSD
    # boundary of cell in lat lon
    x1 = lon - EFFECTIVE_RANGE / 111.320
    x2 = lon + EFFECTIVE_RANGE / 111.320
    y1 = lat - EFFECTIVE_RANGE / 110.574
    y2 = lat + EFFECTIVE_RANGE / 110.574
    
    # boundary of cell in cellSN cellSD index
    x1 = int(round(x1 - BOUNDARY["lon"]["min"], LOG_PRECISE) * PRECISE)
    x2 = int(round(x2 - BOUNDARY["lon"]["min"], LOG_PRECISE) * PRECISE)
    y1 = int(round(y1 - BOUNDARY["lat"]["min"], LOG_PRECISE) * PRECISE)
    y2 = int(round(y2 - BOUNDARY["lat"]["min"], LOG_PRECISE) * PRECISE)
    
    # check x1, x2, y1, y2 in the index boundary
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
      x2 = lonDiff * PRECISE - 1
    if(y1 < 0):
      y1 = 0
    if(y2 >= latCellLength):
      y2 = latDiff * PRECISE - 1
    
    # transfer lat lon into index
    lat = int((lat - BOUNDARY["lat"]["min"]) * PRECISE)
    lon = int((lon - BOUNDARY["lon"]["min"]) * PRECISE)
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
        distance = sqrt(pow(((x - lon) / PRECISE * 111.320), 2) +\
                        pow(((y - lat) / PRECISE * 110.574), 2))
        if(distance > EFFECTIVE_RANGE):
          continue
        
        if distance > 0:
          distanceExp = pow(distance, EXP_FACTOR)
          cellSN[y][x] += value / distanceExp
          cellSD[y][x] += 1 / distanceExp

temp = time.time()
logger.info("idw calculation completes: %f" % (temp - start))
    
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
logger.info("pm2.5 interpolation value calculation completes: %f" % (temp - start))

### Create a contour plot from grid (lat, lon) data ###

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

  ### Convert matplotlib contour to geojson
  geojsoncontour.contour_to_geojson(
    contour = contour_grey,
    geojson_filepath = DIR + 'data/pm25Contour_grey_' + interval + '.geojson',
    min_angle_deg = 10.0,
    ndigits = 3,
    stroke_width = 2,
    unit = "μg/m^3"
  )

end = time.time()
logger.info("pm2.5 contour geojson completes: %f" % (end - start))