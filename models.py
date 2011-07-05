import turkic.database
import turkic.models
from sqlalchemy import Column, Integer, Float, String, Boolean, Text
from sqlalchemy import ForeignKey, Table, PickleType
from sqlalchemy.orm import relationship, backref
import Image
import vision
from vision.track.interpolation import LinearFill
import random
import logging

logger = logging.getLogger("vatic.models")

video_labels = Table("videos2labels", turkic.database.Base.metadata,
    Column("video_id", Integer, ForeignKey("videos.id")),
    Column("label_id", Integer, ForeignKey("labels.id")))

labels_attributes = Table("labels2attributes", turkic.database.Base.metadata,
    Column("label_id", Integer, ForeignKey("labels.id")),
    Column("attribute_id", Integer, ForeignKey("attributes.id")))

boxes_attributes = Table("boxes2attributes", turkic.database.Base.metadata,
    Column("box_id", Integer, ForeignKey("boxes.id")),
    Column("attribute_id", Integer, ForeignKey("attributes.id")))


class Video(turkic.database.Base):
    __tablename__   = "videos"

    id              = Column(Integer, primary_key = True)
    slug            = Column(String(250), index = True)
    labels          = relationship("Label",
                                   secondary = video_labels,
                                   backref = "videos")
    width           = Column(Integer)
    height          = Column(Integer)
    totalframes     = Column(Integer)
    location        = Column(String(250))
    skip            = Column(Integer, default = 0, nullable = False)
    perobjectbonus  = Column(Float, default = 0)
    completionbonus = Column(Float, default = 0)
    trainwithid     = Column(Integer, ForeignKey(id))
    trainwith       = relationship("Video", remote_side = id)
    isfortraining   = Column(Boolean, default = False)
    trainvalidator  = Column(PickleType, nullable = True, default = None)

    def __getitem__(self, frame):
        path = Video.getframepath(frame, self.location)
        return Image.open(path)

    @classmethod
    def getframepath(cls, frame, base = None):
        l1 = frame / 10000
        l2 = frame / 100
        path = "{0}/{1}/{2}.jpg".format(l1, l2, frame)
        if base is not None:
            path = "{0}/{1}".format(base, path)
        return path

class Label(turkic.database.Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key = True)
    text = Column(String(250))
    attributes = relationship("Attribute",
                              secondary = labels_attributes,
                              backref = "labels")

class Attribute(turkic.database.Base):
    __tablename__ = "attributes"

    id = Column(Integer, primary_key = True)
    text = Column(String(250))

class Segment(turkic.database.Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key = True)
    videoid = Column(Integer, ForeignKey(Video.id))
    video = relationship(Video, backref = backref("segments",
                                                  cascade = "all,delete"))
    start = Column(Integer)
    stop = Column(Integer)

    @property
    def paths(self):
        paths = []
        for job in self.jobs:
            if job.useful:
                paths.extend(job.paths)
        return paths

class Job(turkic.models.HIT):
    __tablename__ = "jobs"
    __mapper_args__ = {"polymorphic_identity": "jobs"}

    id             = Column(Integer, ForeignKey(turkic.models.HIT.id),
                            primary_key = True)
    segmentid      = Column(Integer, ForeignKey(Segment.id))
    segment        = relationship(Segment,
                                  backref = backref("jobs",
                                                    cascade = "all,delete"))
    istraining     = Column(Boolean, default = False)

    def getpage(self):
        return "?id={0}".format(self.id)

    def markastraining(self):
        """
        Marks this job as the result of a training run. This will automatically
        swap this job over to the training video and produce a replacement.
        """
        replacement = Job(segment = self.segment, group = self.group)
        self.segment = self.segment.video.trainwith.segments[0]
        self.group = self.segment.jobs[0].group
        self.istraining = True

        logger.debug("Job is now training and replacement built")

        return replacement

    def invalidate(self):
        """
        Invalidates this path because it is poor work. The new job will be
        respawned automatically for different workers to complete.
        """
        self.useful = False
        # is this a training task? if yes, we don't want to respawn
        if not self.istraining:
            return Job(segment = self.segment, group = self.group)

    @property
    def trainingjob(self):
        return self.segment.video.trainwith.segments[0].jobs[0]

    @property
    def validator(self):
        return self.segment.video.trainvalidator

    def __iter__(self):
        return self.paths

class Path(turkic.database.Base):
    __tablename__ = "paths"
    
    id = Column(Integer, primary_key = True)
    jobid = Column(Integer, ForeignKey(Job.id))
    job = relationship(Job, backref = backref("paths", cascade="all,delete"))
    labelid = Column(Integer, ForeignKey(Label.id))
    label = relationship(Label, cascade = "none", backref = "paths")

    interpolatecache = None

    def getboxes(self, interpolate = False):
        result = [x.getbox() for x in self.boxes]
        result.sort(key = lambda x: x.frame)
        if interpolate:
            if not self.interpolatecache:
                self.interpolatecache = LinearFill(result)
            result = self.interpolatecache
        return result

    def __repr__(self):
        return "<Path {0}>".format(self.id)

class Box(turkic.database.Base):
    __tablename__ = "boxes"

    id = Column(Integer, primary_key = True)
    pathid = Column(Integer, ForeignKey(Path.id))
    path = relationship(Path,
                        backref = backref("boxes", cascade = "all,delete"))
    xtl = Column(Integer)
    ytl = Column(Integer)
    xbr = Column(Integer)
    ybr = Column(Integer)
    frame = Column(Integer)
    occluded = Column(Boolean, default = False)
    outside = Column(Boolean, default = False)

    attributes = relationship("Attribute",
                              secondary = boxes_attributes)

    def getbox(self):
        attributes = [(x.id, x.text) for x in self.attributes]
        return vision.Box(self.xtl, self.ytl, self.xbr, self.ybr,
                          self.frame, self.outside, self.occluded,
                          0, attributes)

class PerObjectBonus(turkic.models.BonusSchedule):
    __tablename__ = "per_object_bonuses"
    __mapper_args__ = {"polymorphic_identity": "per_object_bonuses"}

    id = Column(Integer, ForeignKey(turkic.models.BonusSchedule.id), 
        primary_key = True)
    amount = Column(Float, default = 0.0, nullable = False)

    def description(self):
        return (self.amount, "per object")

    def award(self, hit):
        paths = len(hit.paths)
        amount = paths * self.amount
        if amount > 0:
            hit.awardbonus(amount, "For {0} objects".format(paths))
            logger.debug("Awarded per-object bonus of ${0:.2f} for {1} paths"
                            .format(amount, paths))
        else:
            logger.debug("No award for per-object bonus because 0 paths")

class CompletionBonus(turkic.models.BonusSchedule):
    __tablename__ = "completion_bonuses"
    __mapper_args__ = {"polymorphic_identity": "completion_bonuses"}

    id = Column(Integer, ForeignKey(turkic.models.BonusSchedule.id),
        primary_key = True)
    amount = Column(Float, default = 0.0, nullable = False)

    def description(self):
        return (self.amount, "if complete")

    def award(self, hit):
        hit.awardbonus(self.amount, "For complete annotation.")
        logger.debug("Awarded completion bonus of ${0:.2f}"
                        .format(self.amount))
