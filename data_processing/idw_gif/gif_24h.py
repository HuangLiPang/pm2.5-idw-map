#!/usr/bin/env python
"""
Making gif thumbnail for pm2.5 data portal website

versions
  python: 2.7.14
  pillow: 4.1.1
"""

from PIL import Image
import glob
import bisect
from datetime import datetime, timedelta
import config
# parameters & settings ------------------------------
areas = config.SNAPSHOT_CONFIG["areas"]
# indicate how many hours ago for producing the gif
HOURS = 24
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

current = datetime.utcnow()
# change timezone to Asia/Taipei
current = current + timedelta( hours = 8 )
current = current.replace( minute = 0, second = 0, microsecond = 0 )
time_lowerbound = current - timedelta( hours = HOURS )
# add 5 min to make sure the range could include the final file in ??:00 hours
current = current + timedelta( minutes = 5 )

for loc in areas:
	image=[]
	file_prefix = imgSavingPath + loc + '/' + loc + ' '
	file_list = sorted( glob.glob( imgSavingPath + loc + "/*.png" ) )
	date_list = [datetime.strptime( i, file_prefix + "%Y-%m-%d %H:%M.png" ) for i in file_list]

	lower = bisect.bisect_right( date_list, time_lowerbound )
	upper = bisect.bisect_left( date_list, current )

	i = 0
	# handling file amount less than 24 hr
	if lower == 0:
		lower = 1
	file_list = file_list[ (lower - 1):upper ]
	date_list = date_list[ (lower - 1):upper ]
	for filename in file_list:
		check = int( date_list[ i ].minute )
		check = BASE * round( float( check ) / BASE )
		if( check == 0 ):
			# print( "[INSERT] " + str( filename ) )
			im = Image.open( filename )
			image.append( im )
		i = i + 1

	im = Image.open( file_list[ 0 ] )
	im.save( gifSavingPath + loc + '_latest_last_24h.gif', save_all=True, append_images=image, duration=DURATION, loop=LOOP )
