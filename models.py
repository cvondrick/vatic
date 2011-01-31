import turkic.database
import turkic.models
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship, backref
import Image
import vision

video_labels = Table("videos2labels", turkic.database.Base.metadata,
    Column("video_slug", String(250), ForeignKey("videos.slug")),
    Column("label_id", Integer, ForeignKey("labels.id")))

class Video(turkic.database.Base):
    __tablename__ = "videos"

    slug = Column(String(250), primary_key = True)
    labels = relationship("Label", secondary = video_labels, backref = "videos")
    width = Column(Integer)
    height = Column(Integer)
    totalframes = Column(Integer)
    location = Column(String(250))
    skip = Column(Integer, default = 0, nullable = False)

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

class Segment(turkic.database.Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key = True)
    videoslug = Column(String(250), ForeignKey(Video.slug))
    video = relationship(Video, cascade = "all", backref = "segments")
    start = Column(Integer);
    stop = Column(Integer);

class Job(turkic.database.Base):
    __tablename__ = "segment_jobs"

    id = Column(Integer, primary_key = True)
    segmentid = Column(Integer, ForeignKey(Segment.id))
    segment = relationship(Segment, cascade = "all", backref = "jobs")
    hitid = Column(String(30), ForeignKey(turkic.models.HIT.id))
    hit = relationship(turkic.models.HIT, cascade = "all",
        backref = "job", uselist = False)
    
class Path(turkic.database.Base):
    __tablename__ = "paths"
    
    id = Column(Integer, primary_key = True)
    jobid = Column(Integer, ForeignKey(Job.id))
    job = relationship(Job, cascade = "all", backref = "paths")
    labelid = Column(Integer, ForeignKey(Label.id))
    label = relationship(Label, cascade = "none", backref = "paths")

    def getboxes(self):
        return [x.getbox() for x in self.boxes]
        
class Box(turkic.database.Base):
    __tablename__ = "boxes"

    id = Column(Integer, primary_key = True)
    pathid = Column(Integer, ForeignKey(Path.id))
    path = relationship(Path, cascade = "all", backref = "boxes")
    xtl = Column(Integer)
    ytl = Column(Integer)
    xbr = Column(Integer)
    ybr = Column(Integer)
    frame = Column(Integer)
    occluded = Column(Boolean, default = False)
    outside = Column(Boolean, default = False)

    def getbox(self):
        return vision.Box(self.xtl, self.ytl, self.xbr, self.ybr,
                          self.frame, self.outside, self.occluded)
