import os.path, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import config
from turkic.server import handler, application

@handler()
def getjob(hitid):
    return {"start": 1,
            "stop": 300,
            "slug": "http://phoenix.ics.uci.edu/store/frames/parkinglot/",
            "width": 720,
            "height": 405}
