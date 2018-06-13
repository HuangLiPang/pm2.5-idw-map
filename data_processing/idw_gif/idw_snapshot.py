#!/usr/bin/env python
"""
Taking snapshot from pm2.5 idw map to making gif

versions
  python:       2.7.14
  selenium:     3.4.3
  chromedriver: 2.38.3
"""

# selenium screenshot doc: 
# https://selenium-python.readthedocs.io/api.html?highlight=save_screenshot
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

import time
import datetime
from datetime import timedelta
import config

# parameters & settings ------------------------------
areas = config.SNAPSHOT_CONFIG["areas"]
location_zoomSize = config.SNAPSHOT_CONFIG["location_zoomSize"]
imgSavingPath = config.SNAPSHOT_CONFIG["imgSavingPath"]
localWebserverURL = config.SNAPSHOT_CONFIG["localWebserverURL"]
# URL = "http://data.lass-net.org/GIS/IDW/"
chromeDriverPath = config.SNAPSHOT_CONFIG["chromeDriverPath"]
# ------------------------------ parameters & settings

# chrome options
chrome_options = Options()
# work background
chrome_options.add_argument("--headless")
# set window size
chrome_options.add_argument("--window-size=1024x700")
# loading chrome driver
driver = webdriver.Chrome(chrome_options=chrome_options, executable_path=chromeDriverPath)
driver.get(localWebserverURL + "index.html")
print("connect to %s" % localWebserverURL)

for i in len(areas):
	timestamp = datetime.datetime.now()
	# change timezone to Asia/Taipei
	timestamp = timestamp.strftime("%Y-%m-%d %H:%M")
	driver.execute_script("map.setView(%s);" % location_zoomSize[i])
	time.sleep(10)
	driver.get_screenshot_as_file("%(imgSavingPath)s%(areas)s/%(areas)s %(timestamp)s.png" % \
		({"imgSavingPath": imgSavingPath, "areas": areas[i], "timestamp": timestamp}))
	print("%s png saved at %s" % (areas[i], timestamp))

# close current window
driver.close()
# quit driver and close every window
driver.quit()