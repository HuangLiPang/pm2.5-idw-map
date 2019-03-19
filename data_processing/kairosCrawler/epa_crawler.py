#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
  Created on 2019 Jan.
  @author: HuangLiPang

  python version: 2.7
  
  Kairos Rest API doc:
  http://kairosdb.github.io/docs/build/html/restapi/index.html

  Description:
    Crawling Taiwan CWB data stored in LASS GCP KairosDB.
"""

import requests
import json
import re
import logging
import logging.config
import RotatingFileNameHandler.logging_config as logging_config
from RotatingFileNameHandler.RotatingFileNameHandler import RotatingFileNameHandler
import config
from time import gmtime, strftime, time
from KairosDBWorker import KairosDBWorker

KairosDB_URL = config.KairosDB["URL"]
KairosDB_USER = config.KairosDB["USER"]
KairosDB_PASSWORD = config.KairosDB["PASSWORD"]
KairosDB_FilePath = config.KairosDB["FilePath"] + "/epa.json"
KairosDB_LogPath = config.KairosDB["LogPath"]

def findInfo(reg, source):
  result = re.search(reg, source)
  if(result == None): return None
  result = result.group(0)
  result = float(result.split("=")[-1])
  return result

# load config file
logging.config.dictConfig(logging_config.LOGGING)

# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath, maxBytes=1024, backupCount=3)
logger.addHandler(RotatingFileNameHandler(__file__, KairosDB_LogPath, maxBytes=1024000, backupCount=5))

worker = KairosDBWorker(KairosDB_URL, KairosDB_USER, KairosDB_PASSWORD)
logger.info("create worker")

# query stationId tags in CWB metrics
option = {
  "start_relative": {
    "value": "2",
    "unit": "hours" 
  },
  "metrics": [
    {
      "name": "EPA.AllData"
    }
  ]
}
stationIds = worker.queryWithPost("/query/tags", option)["queries"][0]["results"][0]["tags"]["device_id"]
logger.info("query tags in EPA.AllData, tags length: " + str(len(stationIds)))

option = {
  "start_relative": {
    "value": 5,
    "unit": "hours" 
  },
  "time_zone": "Asia/Taipei",
  "metrics": [
    {
      "name": "EPA.AllData",
      "tags": {
        "device_id": ""
      },
      "limit": 30,
      "aggregators": [
        {
         "name": "last",
         "align_sampling": True,
         "sampling": {
             "value": 1,
             "unit": "days"
          }
        }
      ]
    }
  ]
}

tempData = []
for stationId in stationIds:
  option["metrics"][0]["tags"]["device_id"] = stationId
  try:
    stationJson = worker.queryWithPost("/query", option)
    # check values 
    if len(stationJson["queries"][0]["results"][0]["values"]) == 0:
      raise Exception("values is empty")
    dataTime = stationJson["queries"][0]["results"][0]["values"][-1][0]
    # check the data time
    if dataTime - int(round(time() * 1000)) > 3600000:
      raise Exception("data time is bigger than an hour, time: " + str(dataTime))
    stationStatus = stationJson["queries"][0]["results"][0]["values"][-1][1]
    stationStatus = stationStatus.encode("utf-8")

    lat = findInfo(r"Latitude=\d+\.\d+", stationStatus)
    lon = findInfo(r"Longitude=\d+\.\d+", stationStatus)
    pm25 = findInfo(r"PM2_5=-?\d+\.?\d?", stationStatus)
    # check temperature
    if pm25 == None:
      raise Exception("No PM2_5 value")
    tempData.append([lat, lon, pm25])
  except Exception as err:
    logger.error("station id: " + stationId)
    logger.error(err)

logger.info("query complete, tempData length: " + str(len(tempData)))

epa = {
  "latest-updated-time": strftime("%Y-%m-%dT%H:00:00Z", gmtime()), 
  "points": tempData
}
with open(KairosDB_FilePath, 'w') as outfile:  
  json.dump(epa, outfile)
