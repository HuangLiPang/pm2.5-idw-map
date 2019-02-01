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
KairosDB_FilePath = config.KairosDB["FilePath"]

def findInfo(reg, source):
  result = re.search(reg, source)
  result = result.group(0)
  result = float(result.split("=")[1])
  return result

# load config file
logging.config.dictConfig(logging_config.LOGGING)

# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath, maxBytes=1024, backupCount=3)
logger.addHandler(RotatingFileNameHandler(__file__, "./log", maxBytes=1024000, backupCount=5))

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
      "name": "CWB.AllData"
    }
  ]
}
stationIds = worker.queryWithPost("/query/tags", option)["queries"][0]["results"][0]["tags"]["stationId"]
logger.info("query tags in CWB.AllData, tags length: " + str(len(stationIds)))

option = {
  "start_relative": {
    "value": 5,
    "unit": "hours" 
  },
  "time_zone": "Asia/Taipei",
  "metrics": [
    {
      "name": "CWB.AllData",
      "tags": {
        "stationId": ""
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
  option["metrics"][0]["tags"]["stationId"] = stationId
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

    lat = findInfo(r"lat_wgs84=\d+.\d+", stationStatus)
    lon = findInfo(r"lon_wgs84=\d+.\d+", stationStatus)
    temp = findInfo(r"TEMP=\d+.\d+|TEMP=-\d+|TEMP=-\d+.\d+", stationStatus)
    # check temperature
    if temp == -99:
      raise Exception("TEMP = -99")
    tempData.append([lat, lon, temp])
  except Exception as err:
    logger.error("station id: " + stationId)
    logger.error(err)

logger.info("query complete, tempData length: " + str(len(tempData)))

cwb = {
  "latest-updated-time": strftime("%Y-%m-%dT%H:%M:%SZ", gmtime()), 
  "points": tempData
}
with open(KairosDB_FilePath, 'w') as outfile:  
  json.dump(cwb, outfile)