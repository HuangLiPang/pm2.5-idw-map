#!/bin/bash
IMG_DIR="/home/ubuntu/www/pm2.5-idw-with-weather/data_processing/idw_gif/img"
AREA=("Taipei" "Taoyuan" "Taichung" "Tainan" "Taiwan")

cd ${IMG_DIR}
for city in ${AREA[@]}; do
  cd ${city}
  filename=`ls -Art | tail -n 1`
  scp ./"${filename}" IISNRL_MacMini:/Users/iisnrl/Documents/code/img/${city}
  cd ..
done
exit 0
