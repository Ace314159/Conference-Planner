import time
import datetime
time_zone_diff = (5 * 60 * 60) + (30 * 60)  # +5:30

Y = int(input("What is the start year? "))
m = int(input("What is the start month? "))
d = int(input("What is the start day? "))

while(1):
    sH = int(input("What is the start hour (use military time)? "))
    sM = int(input("What is the start minute? "))

    eH = int(input("What is the end hour (use military time)? "))
    eM = int(input("What is the end minute? "))

    D = (datetime.datetime(Y, m, d) +
         datetime.timedelta(seconds=time_zone_diff)).timetuple()

    print()
    print("sDay=" + str(int(time.mktime(D))), end="&")
    print("sTime=" + str(int((sH * 60 * 60) + (sM * 60))), end="&")
    print("eDay=" + str(int(time.mktime(D))), end="&")
    print("eTime=" + str(int((eH * 60 * 60) + (eM * 60))))
