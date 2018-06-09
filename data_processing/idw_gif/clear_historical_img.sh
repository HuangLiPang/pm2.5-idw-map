#!/bin/bash

DIR="/Users/huanglipang/Documents/github/iis_sinica/idw_gif"
CITIES=('Taiwan' 'Taipei' 'Taoyuan' 'Taichung' 'Tainan')
# get the date
TWODAYSAGO=`date '+%Y-%m-%d'`

#TWODAYSAGO='2017-06-12'

for VAR in "${CITIES[@]}"
do
    LOC=$DIR/img/$VAR
    echo $LOC
    echo $TWODAYSAGO
    cd $LOC
    NAME='*'$TWODAYSAGO'*png'
    # find | grep $TWODAYSAGO | xargs rm -f
    find $LOC -type f -name "$NAME" -exec rm {} \;
done
