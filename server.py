import os.path, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import config
from turkic.server import handler, application
from turkic import database
import cStringIO
from models import *

@handler()
def getjob(id):
    session = database.connect()
    try:
        job = session.query(Job).get(id)
        segment = job.segment
        video = segment.video
    finally:
        session.close

    return {"start": segment.start,
            "stop": segment.stop,
            "slug": video.slug,
            "width": video.width,
            "height": video.height}
