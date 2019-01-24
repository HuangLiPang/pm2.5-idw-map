#!/usr/bin/env python3
''' 
'''

import requests
import json
import re
import config
from time import gmtime, strftime
from KairosDBWorker import KairosDBWorker

KairosDB_URL = config.KairosDB["URL"]
KairosDB_USER = config.KairosDB["USER"]
KairosDB_PASSWORD = config.KairosDB["PASSWORD"]

worker = KairosDBWorker(KairosDB_URL, KairosDB_USER, KairosDB_PASSWORD)

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
option = {
  "start_relative": {
    "value": 2,
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
    stationStatus = stationJson["queries"][0]["results"][0]["values"][-1][1]
    lat = float(re.search(r"lat_wgs84=\d+.\d+", stationStatus)[0].split("=")[1])
    lon = float(re.search(r"lon_wgs84=\d+.\d+", stationStatus)[0].split("=")[1])
    temp = float(re.search(r"TEMP=\d+.\d+", stationStatus)[0].split("=")[1])

    tempData.append([lat, lon, temp])
  except Exception as err:
    print(err)
    print(stationId)
cwb = {
  "latest-updated-time": strftime("%Y-%m-%dT%H:%M:%SZ", gmtime()), 
  "points": tempData
}
with open('cwb.json', 'w') as outfile:  
    json.dump(cwb, outfile)