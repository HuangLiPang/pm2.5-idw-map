#!/usr/bin/env python
"""
Making gif for pm2.5 data portal website with hour image

@author: Yu-Chang Ho, HuangLiPang

Dependencies:
  python  2.7.14
  pillow  4.1.1
"""

from PIL import Image
import glob
import bisect
from datetime import datetime, timedelta
import config
import logging
import logging.config
import logging_config
from logging_config import RotatingFileNameHandler

# parameters & settings ------------------------------
AREAS = config.SNAPSHOT_CONFIG["areas"]
# indicate how many hours ago for producing the gif
HOURS = config.GIF_CONFIG["HOURS"]
# Rounded
BASE = config.GIF_CONFIG["BASE"]
# use 20 min per image to form the .gif file
IMG_RANGE = config.GIF_CONFIG["IMG_RANGE"]
# the time for each frame
DURATION = config.GIF_CONFIG["DURATION"]
# indicate the times for looping the animation
LOOP = config.GIF_CONFIG["LOOP"]

imgSavingPath = config.SNAPSHOT_CONFIG["imgSavingPath"]
gifSavingPath = config.GIF_CONFIG["gifSavingPath"]
# ------------------------------ parameters & settings

# load config file
logging.config.dictConfig(logging_config.LOGGING)

# create logger
logger = logging.getLogger()
# RotatingFileNameHandler(filename, logPath)
logger.addHandler(RotatingFileNameHandler(__file__, config.DIR + "data_processing/idw_gif/log/"))

# time processing
current = datetime.utcnow()
# change timezone to Asia/Taipei
current = current + timedelta(hours = 8)
current = current.replace(minute = 0, second = 0, microsecond = 0)
timeLowerBound = current - timedelta(hours = HOURS)
# add 5 min to make sure the range could include the final file in ??:00 hours
current = current + timedelta(minutes = 5)

for area in AREAS:
  images=[]
  filePrefix = "%(imgSavingPath)s%(area)s/%(area)s " %\
    ({"imgSavingPath": imgSavingPath, "area": area})

  # glob.glob(pathname)
  # Return a possibly-empty list of path names that match pathname, 
  # which must be a string containing a path specification
  # doc: 
  # https://docs.python.org/2/library/glob.html
  fileList = sorted(glob.glob("%(imgSavingPath)s%(area)s/*.png" % \
      ({"imgSavingPath": imgSavingPath, "area": area})))
  # datetime.strptime(date_string, format)
  # the datetime.strptime() class method creates a datetime object 
  # from a string representing a date and 
  # time and a corresponding format string.
  # doc: 
  # https://docs.python.org/2/library/datetime.html#strftime-strptime-behavior
  dateList = [datetime.strptime(i, filePrefix + "%Y-%m-%d %H:%M.png")\
               for i in fileList]

  # bisect.bisect_left(a, x, lo=0, hi=len(a))
  # Locate the insertion point for x in a to maintain sorted order.
  # The returned insertion point i partitions the array a into two halves 
  # so that all(val < x for val in a[lo:i]) for the left side and 
  # all(val >= x for val in a[i:hi]) for the right side.
  lowerIndex = bisect.bisect_right(dateList, timeLowerBound)
  upperIndex = bisect.bisect_left(dateList, current)

  # handling file amount less than 24 hr
  if lowerIndex == 0:
    lowerIndex = 1
  fileList = fileList[(lowerIndex - 1):upperIndex]
  dateList = dateList[(lowerIndex - 1):upperIndex]

  # Append hourly image into images
  for i in range(len(fileList)):
    # check if the time is on the hour or not
    checkOnTheHour = BASE * round(float(dateList[i].minute) / BASE)
    if(checkOnTheHour == 0):
      try:
        images.append(Image.open(fileList[i]))
      except Exception as err:
        logger.error("Append %s image failed." % fileList[i])
        logger.error(err)

  try:
    gif = Image.open(fileList[0])
  except Exception as err:
    logger.error("Open %s first image error" % area)
    logger.error(err)

  try:
    # Image.save(fp, format=None, **params)
    # gif parameter options doc:
    # https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#gif
    # http://pillow.readthedocs.io/en/4.2.x/releasenotes/3.4.0.html#append-images-to-gif
    gif.save("%(gifSavingPath)s%(area)s_latest_thumbnail.gif" %\
            ({"gifSavingPath": gifSavingPath, "area": area}),\
            format="GIF",\
            save_all=True,\
            append_images=images,\
            duration=DURATION,\
            loop=LOOP)
    logger.info("%s gif saved." % area)
  except Exception as err:
    logger.error("Save %s gif failed." % area)
    logger.error(err)
