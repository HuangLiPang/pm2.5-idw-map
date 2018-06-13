#!/bin/bash
DIR=`pwd`
CITIES=('Taiwan' 'Taipei' 'Taoyuan' 'Taichung' 'Tainan')

# get the date
OS=$(uname -s)
if [[ "${OS}" == "Linux" ]]; then
    TWO_DAYS_AGO=`date --date="-2 day" +%Y-%m-%d`
elif [[ "${OS}" == "Darwin" ]]; then
    TWO_DAYS_AGO=`date -v-2d +%Y-%m-%d`
else
    echo "unknown OS"
    exit 1
fi

# TWODAYSAGO='2017-06-12'

for VAR in "${CITIES[@]}"
do
    LOC="${DIR}"/img/"${VAR}"
    echo ${LOC}
    echo ${TWO_DAYS_AGO}
    cd ${LOC}
    NAME='*'"${TWO_DAYS_AGO}"'*png'
    # find | grep $TWODAYSAGO | xargs rm -f
    find $LOC -type f -name "${NAME}" -exec rm {} \;
done
