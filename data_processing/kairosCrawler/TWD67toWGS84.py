import os, re

def TWD67toWGS84(x,y):
   out = {'status':False}
   lat = None
   lon = None
   
   # TWD67 to TWD97
   A = 0.00001549
   B = 0.000006521
   x = float(x)
   y = float(y)
   x = x + 807.8 + A * x + B * y
   y = y - 248.6 + A * y + B * x

   # TWD97 to WGS84
   result = os.popen('echo '+str(x)+' '+str(y)+' | proj -I +proj=tmerc +ellps=GRS80 +lon_0=121 +x_0=250000 +k=0.9999 -f "%.8f"').read().strip() # lat, lng 格式, 不必再轉換
   process = re.compile( '([0-9]+\.[0-9]+)', re.DOTALL )
   for item in process.findall(result):
      if lon == None:
         lon = float(item)
      elif lat == None:
         lat = float(item)
      else:
         break


   # result = os.popen('echo '+str(x)+' '+str(y)+' | proj -I +proj=tmerc +ellps=GRS80 +lon_0=121 +x_0=250000 +k=0.9999').read().strip() # 分度秒格式


   # 分度秒格式轉換
   #process = re.compile( "([0-9]+)d([0-9]+)'([0-9\.]+)\"E\t([0-9]+)d([0-9]+)'([0-9\.]+)", re.DOTALL )
   #for item in process.findall(result):
   #    lon = float(item[0]) + ( float(item[1]) + float(item[2])/60 )/60
   #    lat = float(item[3]) + ( float(item[4]) + float(item[5])/60 )/60
   #    break
   if lat == None or lon == None:
      return out
   out['lat'] = lat
   out['lng'] = lon
   out['status'] = True
   return out
print(TWD67toWGS84(24.976719, 121.393789))