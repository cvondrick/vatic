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
        group = job.hit.group
        labels = dict((l.id, l.text) for l in video.labels)
    finally:
        session.close()

    return {"start":  segment.start,
            "stop":   segment.stop,
            "slug":   video.slug,
            "width":  video.width,
            "height": video.height,
            "skip":   video.skip,
            "perobject": group.perobject,
            "completion": group.bonus,
            "jobid":  job.id,
            "labels": labels}

@handler(post = "json")
def savejob(id, tracks):
    session = database.connect()
    try:
        job = session.query(Job).get(id)
        for label, track in tracks:
            path = Path(job = job)
            path.label = session.query(Label).get(label)

            for frame, userbox in track.items():
                box = Box(path = path)
                box.xtl = userbox[0]
                box.ytl = userbox[1]
                box.xbr = userbox[2]
                box.ybr = userbox[3]
                box.occluded = userbox[4]
                box.outside = userbox[5]
                box.frame = frame
                path.boxes.append(box)
            job.paths.append(path)
        job.hit.numobjects = len(tracks)

        session.add(job)
        session.commit()
    finally:
        session.close()
    return True
