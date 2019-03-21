#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
  Created on 2019 Mar.
  @author: HuangLiPang

  python version: 2.7

  Description:
    LASS calibration api crawler
"""

from requests import get
from time import gmtime, strftime
from json import dump
import logging
import logging.config
import RotatingFileNameHandler.logging_config as logging_config
from RotatingFileNameHandler.RotatingFileNameHandler import RotatingFileNameHandler
import config

URL = config.Calibration["URL"]
FilePath = config.Calibration["FilePath"]
LogPath = config.Calibration["LogPath"]

# load config file
logging.config.dictConfig(logging_config.LOGGING)
# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath, maxBytes=1024, backupCount=3)
logger.addHandler(RotatingFileNameHandler(__file__, LogPath, maxBytes=1024000, backupCount=5))

try:
  response = get(URL)
  logger.info("get calibration data")
  response = response.json()

  response = response["feeds"]
  tempData = []
  for station in response:
    if "c_d0" in station:
      tempData.append([station["gps_lat"], station["gps_lon"], station["c_d0"]])

  logger.info("get complete, tempData length: " + str(len(tempData)))
  calibration = {
    "latest-updated-time": strftime("%Y-%m-%dT%H:00:00Z", gmtime()), 
    "points": tempData
  }

  with open(FilePath, 'w') as outfile:  
    dump(calibration, outfile)
except Exception as err:
      logger.error(err)