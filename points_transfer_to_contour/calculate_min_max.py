import json

data = json.load(open('pm25.json'))

def findMax(x, y):
  if x > y:
    return x
  else:
    return y

def findMin(x, y):
  if x < y:
    return x
  else:
    return y


points = data['points']


latMin = 1000.0
lonMin = 1000.0
latMax = 0.0
lonMax = 0.0

for point in points:
  latTemp = point[0]
  lonTemp = point[1]
  if(latTemp >= 20.0 and latTemp <= 27.0):
    latMin = findMin(latTemp, latMin)
    latMax = findMax(latTemp, latMax)
  if(lonTemp >= 115.0 and lonTemp <= 125.0):
    lonMin = findMin(lonTemp, lonMin)
    lonMax = findMax(lonTemp, lonMax)
    
    