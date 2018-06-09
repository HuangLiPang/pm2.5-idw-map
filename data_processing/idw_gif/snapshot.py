#!/usr/bin/env python
# version config
# 	python: 			2.7.14
# 	selenium: 		3.4.3
# 	chromedriver: 2.38.3

# selenium screenshot doc: https://selenium-python.readthedocs.io/api.html?highlight=save_screenshot

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

import time
import datetime
from datetime import timedelta

# parameters & settings ------------------------------
areas = ['Taiwan', 'Taipei', 'Taichung', 'Tainan', 'Taoyuan']
scripts = ["[23.633319, 120.883727], 8", "[25.082, 121.566], 11", "[24.205, 120.670], 10", "[22.733796, 120.693579], 9", "[24.950, 121.255], 11"]
imgSavingPath = "/Users/huanglipang/Documents/github/iis_sinica/idw_gif/img/"
localWebserverURL = "http://127.0.0.1:3000/"
# URL = "http://data.lass-net.org/GIS/IDW/"
chromeDriverPath = "/Users/huanglipang/node_modules/chromedriver/bin/chromedriver"
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

for i in xrange(5):
	timestamp = datetime.datetime.now()
	# change timezone to Asia/Taipei
	timestamp = timestamp.strftime("%Y-%m-%d %H:%M")
	driver.execute_script("map.setView(%s);" % scripts[i])
	time.sleep(10)
	driver.get_screenshot_as_file("%(imgSavingPath)s%(areas)s/%(areas)s %(timestamp)s.png" % \
		({"imgSavingPath": imgSavingPath, "areas": areas[i], "timestamp": timestamp}))
	print("%s png saved at %s" % (areas[i], timestamp))

# close current window
driver.close()
# quit driver and close every window
driver.quit()