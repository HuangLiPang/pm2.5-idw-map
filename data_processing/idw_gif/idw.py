#!/usr/bin/env python
import json
import re
import sys  
import operator
import random
import math
from datetime import datetime
random.seed(datetime.now())

#DATA_SOURCE = ["EPA", "AirBox", "AirBox2", "LASS", "LASS4U", "ProbeCube", "Webduino", "Indie" ]
DATA_SOURCE = ["AirBox", "AirBox2", "LASS", "MAPS","EEVEE","AirQ"]
JSON_API="/home/ubuntu/LASS/scripts/JSON_API"
AirBox_Data = "/home/ubuntu/LASS/scripts/AirBox"
WWW_Data = "/var/www/html/data"
WWW_GIS = "/var/www/html/GIS"

JSON_FILES = { 
		"EPA": WWW_Data + "/last-all-epa.json",
		"AirBox": WWW_Data + "/last-all-airbox.json",
		"LASS": WWW_Data + "/last-all-lass.json",
		"LASS4U": WWW_Data + "/last-all-lass4u.json",
		"ProbeCube": WWW_Data + "/last-all-probecube.json",
		"Indie": WWW_Data + "/last-all-indie.json",
		"Webduino": WWW_Data + "/last-all-webduino.json",
		"MAPS": WWW_Data + "/last-all-maps.json",
		"EEVEE": WWW_Data + "/last-all-eevee.json",
		"AirBox2" : "/tmp/last-all-airbox2.json",
		"AirQ" : "/tmp/last-all-airq.json",
	     }
DATA_PM25_attr = { "AirBox":"s_d0",
		"AirBox2":"s_d0",
		"LASS":"s_d0",
		"LASS4U":"s_d0",
		"MAPS":"s_d0",
		"EEVEE":"s_d0",
		"EPA":"PM2_5",
		"ProbeCube":"PM2_5",
		"Indie":"PM2_5",
		"Webduino":"PM2_5",
		"AirQ":"s_d0",
	     }
DATA_TEMP_attr = { "AirBox":"s_t0",
		"AirBox2":"s_t0",
		"LASS":"s_t0",
		"LASS4U":"s_t2",
		"MAPS":"s_t4",
		"EEVEE":"s_t0",
		"EPA":"Temperature",
		"ProbeCube":"Temperature",
		"Indie":"Temperature",
		"Webduino":"Temperature",
		"AirQ": "N/A",
	     }
GPS_files = [
		AirBox_Data + "/school.json"
	]

Out_File_JS = open( WWW_GIS + "/IDW/data.js", 'w')
Out_File_JS_TEMP = open( WWW_GIS + "/IDW/data-temp.js", 'w')
Out_File_ISO = open( WWW_GIS + "/IDW/data_iso.json", 'w')

Malfunction_File_Name = WWW_Data + "/device_malfunction_daily.json"
Malfunction = {}
JSON_file = open(Malfunction_File_Name,'r')
data = json.loads(JSON_file.read().decode("utf-8-sig"))
feeds = data['feeds']
for item in feeds:
        if item['2'] > 0.33333:  # considered to be indoor or out of order
                Malfunction[item['device_id']] = 'true'
        elif item['3'] > 0.5:   # considered out of order
                Malfunction[item['device_id']] = 'true'
        else:
                continue

GPS_lat = {}
GPS_lon = {}
for fgps in GPS_files:
	try:
		JSON_file = open(fgps,'r')
		data = json.loads(JSON_file.read().decode("utf-8-sig"))
		schools = data['school']
		for item in schools:
			GPS_lat[item["id"]] = float(item["lat"])
			GPS_lon[item["id"]] = float(item["lon"])

	except:
		continue

msg = "var PM25points = ["
Out_File_JS.write(msg)
msg = "var TEMPpoints = ["
Out_File_JS_TEMP.write(msg)
isojson = {}
isodata = []
pm25 = ""
temp = ""
for source in DATA_SOURCE:
	fname = JSON_FILES[source]
	pm25_attr = DATA_PM25_attr[source]
	temp_attr = DATA_TEMP_attr[source]
	try:
		JSON_file = open(fname,'r')
		data = json.loads(JSON_file.read().decode("utf-8-sig"))
		feeds = data['feeds']
		version = data['version']
		for item in feeds:
			pm25 = -1;
			temp = -100
			if pm25_attr in item:
				pm25 = item[pm25_attr]
				if pm25=="":
					continue
			else:
				pm25 = -1
			if temp_attr in item:
				temp = item[temp_attr]
				if temp=="" or temp>100 or temp<-40: # to remove exceptions and outliers 
					continue
			else:
				temp = -100
			if item['device_id'] in Malfunction:
				continue
			if item["device_id"] in GPS_lat:
				gps_lat = GPS_lat[item['device_id']]
				gps_lon = GPS_lon[item['device_id']]
			else:
				gps_lat = item['gps_lat']
				gps_lon = item['gps_lon']

			gps_lat = gps_lat + random.uniform(0,0.00050)
			gps_lon = gps_lon + random.uniform(0,0.00050)

			color = pm25
			msg = "[" + str(gps_lat) + ", " + str(gps_lon) + ", " + str(color) + "],"
			Out_File_JS.write(msg)
			color =temp 
			msg = "[" + str(gps_lat) + ", " + str(gps_lon) + ", " + str(color) + "],"
			Out_File_JS_TEMP.write(msg)

			if gps_lat > 25.5 or gps_lat < 21.5 or gps_lon > 122 or gps_lon < 119.8:
				continue

			features = {}
			geometry = {}
			properties = {}
			geometry['coordinates'] = [gps_lon, gps_lat]
			geometry['type'] = "Point"
			if pm25 != -1:
				properties['pm25'] = pm25
			if temp != -100:
				properties['temp'] = temp
			features['geometry'] = geometry
			features['properties'] = properties
			features['type'] = "Feature"
			isodata.append(features)
	except:
		print "error 1"
		continue

try:
	msg = "[" + str(gps_lat) + ", " + str(gps_lon) + ", " + str(pm25) + "]"
	Out_File_JS.write(msg)
except:
	print "error 2"

Out_File_JS.write("];\n")
Out_File_JS.write("var version = \"" + str(version) + "\";")

try:
	msg = "[" + str(gps_lat) + ", " + str(gps_lon) + ", " + str(temp) + "]"
	Out_File_JS_TEMP.write(msg)
except:
	print "error 3"

Out_File_JS_TEMP.write("];\n")
Out_File_JS_TEMP.write("var version = \"" + str(version) + "\";")

def compare_features(x,y):
	print x
	print y
	if x['geometry']['coordinates'][0] == y['geometry']['coordinates'][0]:
		return int(10000*x['geometry']['coordinates'][1] - y['geometry']['coordinates'][1])
	else:
		return int(10000*x['geometry']['coordinates'][0] - y['geometry']['coordinates'][0])

#isojson['features'] = sorted(isodata, cmp=compare_features)
isojson['features'] = sorted(isodata, key=lambda k:k['geometry']['coordinates'][0])
isojson['type'] = "FeatureCollection"
json_results = json.dumps(isojson)
Out_File_ISO.write(json_results)
