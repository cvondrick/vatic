import os.path, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import config
from turkic.server import handler, application
from turkic.database import session
import cStringIO
from models import *
import qa

import logging
logger = logging.getLogger("vatic.server")

@handler()
def getjob(id, verified):
    job = session.query(Job).get(id)

    logger.debug("Found job {0}".format(job.id))

    if int(verified) and job.segment.video.trainwith:
        # swap segment with the training segment
        training = True
        segment = job.segment.video.trainwith.segments[0]
        logger.debug("Swapping actual segment with training segment")
    else:
        training = False
        segment = job.segment

    video = segment.video
    labels = dict((l.id, l.text) for l in video.labels)

    logger.debug("Giving user frames {0} to {1} of {2}".format(video.slug,
                                                               segment.start,
                                                               segment.stop))

    return {"start":        segment.start,
            "stop":         segment.stop,
            "slug":         video.slug,
            "width":        video.width,
            "height":       video.height,
            "skip":         video.skip,
            "perobject":    video.perobjectbonus,
            "completion":   video.completionbonus,
            "jobid":        job.id,
            "training":     int(training),
            "labels":       labels}

@handler(post = "json")
def savejob(id, verified, tracks):
    job = session.query(Job).get(id)

    logger.debug("Found job {0}".format(job.id))

    if int(verified) and job.segment.video.trainwith:
        replacement, trainingjob = job.markastraining()

    logger.debug("Saving {0} total tracks".format(len(tracks)))

    for label, track in tracks:
        path = Path(job = job)
        path.label = session.query(Label).get(label)
        
        logger.debug("Received a {0} track".format(path.label.text))

        for frame, userbox in track.items():
            box = Box(path = path)
            box.xtl = int(userbox[0])
            box.ytl = int(userbox[1])
            box.xbr = int(userbox[2])
            box.ybr = int(userbox[3])
            box.occluded = int(userbox[4])
            box.outside = int(userbox[5])
            box.frame = int(frame)

            logger.debug("Received box {0}".format(str(box.getbox())))

        job.paths.append(path)

    if int(verified):
        validator = trainingjob.segment.video.trainvalidator
        passed = qa.validate(job.paths, trainingjob.paths, validator)
        job.marktrainingresult(passed)
        if passed:
            logger.debug("Worker passed the training")
        else:
            logger.debug("Worker FAILED the training")

        replacement.publish()
        logger.debug("Republished replacement for training")
        session.add(replacement)

    session.add(job)
    session.commit()
    return True
