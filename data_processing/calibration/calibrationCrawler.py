#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
  Created on 2019 Mar.
  @author: HuangLiPang

  python version: 2.7

  Description:
    LASS calibration api crawler
"""

from time import gmtime, strftime
import json
import logging
import logging.config
import RotatingFileNameHandler.logging_config as logging_config
from RotatingFileNameHandler.RotatingFileNameHandler import RotatingFileNameHandler
import config

InputFilePath = config.Calibration["InputFilePath"]
OutputFilePath = config.Calibration["OutputFilePath"]
LogPath = config.Calibration["LogPath"]

# load config file
logging.config.dictConfig(logging_config.LOGGING)
# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath, maxBytes=1024, backupCount=3)
logger.addHandler(RotatingFileNameHandler(__file__, LogPath, maxBytes=1024000, backupCount=5))

try:

  lastAllAirbox = None
  with open(InputFilePath) as infile:
    lastAllAirbox = json.load(infile)
  logger.info("get calibration data")

  lastAllAirbox = lastAllAirbox["feeds"]
  tempData = []
  for station in lastAllAirbox:
    if "c_d0" in station:
      tempData.append([station["gps_lat"], station["gps_lon"], station["c_d0"]])

  logger.info("get complete, tempData length: " + str(len(tempData)))
  calibration = {
    "latest-updated-time": strftime("%Y-%m-%dT%H:00:00Z", gmtime()), 
    "points": tempData
  }

  with open(OutputFilePath, 'w') as outfile:  
    json.dump(calibration, outfile)
except Exception as err:
      logger.error(err)