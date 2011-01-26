import os
import sys
import math
import argparse
import config
import shutil
from turkic.cli import handler, importparser, Command, LoadCommand
from turkic import database
from vision import ffmpeg
import vision.visualize
import vision.track.interpolation
import turkic.models
from models import *

@handler("Decompresses an entire video into frames")
class extract(Command):
    def setup(self):
        parser = argparse.ArgumentParser()
        parser.add_argument("video")
        parser.add_argument("output")
        parser.add_argument("--width", default=720, type=int)
        parser.add_argument("--height", default=480, type=int)
        parser.add_argument("--no-cleanup", action="store_true", default=False)
        return parser

    def __call__(self, args):
        try:
            os.makedirs(args.output)
        except:
            pass
        sequence = ffmpeg.extract(args.video)
        try:
            for frame, image in enumerate(sequence):
                if frame % 100 == 0:
                    print "Decoding frames {0} to {1}".format(frame, frame + 100)
                image.thumbnail((args.width, args.height), Image.BILINEAR)
                path = Video.getframepath(frame, args.output)
                try:
                    image.save(path)
                except IOError:
                    os.makedirs(os.path.dirname(path))
                    image.save(path)
        except:
            if not args.no_cleanup:
                print "Aborted. Cleaning up..."
                shutil.rmtree(args.output)
            raise

@handler("Imports a set of video frames")
class load(LoadCommand):
    def setup(self):
        parser = argparse.ArgumentParser(parents = [importparser])
        parser.add_argument("slug")
        parser.add_argument("location")
        parser.add_argument("labels", nargs="+")
        parser.add_argument("--length", type=int, default = 300)
        parser.add_argument("--overlap", type=int, default = 20)
        return parser

    def title(self, args):
        return "Video annotation"

    def description(self, args):
        return "Draw boxes around objects moving around in a video."

    def cost(self, args):
        return 1.00

    def duration(self, args):
        return 7200

    def keywords(self, args):
        return "video, annotation, computer, vision"

    def __call__(self, args, group):
        print "Checking integrity..."

        # read first frame to get sizes
        path = Video.getframepath(0, args.location)
        try:
            im = Image.open(path)
        except IOError:
            print "Cannot read {0}".format(path)
            return
        width, height = im.size

        print "Searching for last frame..."

        # search for last frame
        toplevel = max(int(x)
            for x in os.listdir(args.location))
        secondlevel = max(int(x)
            for x in os.listdir("{0}/{1}".format(args.location, toplevel)))
        maxframes = max(int(os.path.splitext(x)[0])
            for x in os.listdir("{0}/{1}/{2}"
            .format(args.location, toplevel, secondlevel)))

        print "Found {0} frames.".format(maxframes)

        # can we read the last frame?
        path = Video.getframepath(maxframes, args.location)
        try:
            im = Image.open(path)
        except IOError:
            print "Cannot read {0}".format(path)
            return

        # check last frame sizes
        if im.size[0] != width and im.size[1] != height:
            print "First frame dimensions differs from last frame"
            return

        session = database.connect() 
        try:
            # create video
            video = Video(slug = args.slug,
                          location = args.location, 
                          width = width,
                          height = height,
                          totalframes = maxframes)
            session.add(video)

            print "Binding labels..."

            # create labels
            for labeltext in args.labels:
                label = Label(text = labeltext)
                session.add(label)
                video.labels.append(label)

            print "Creating symbolic link..."
            symlink = "public/frames/{0}".format(video.slug)
            try:
                os.symlink(video.location, symlink)
            except:
                print "Cannot create symbolic link!"

            print "Creating segments..."
            
            # create shots and jobs
            for start in range(0, video.totalframes, args.length):
                stop = min(start + args.length + args.overlap + 1, video.totalframes)
                segment = Segment(start = start, stop = stop, video = video)
                job = Job(segment = segment)
                session.add(segment)
                session.add(job)
                session.commit()

                hit = turkic.models.HIT(group = group, 
                                        page = "?id={0}".format(job.id))
                job.hit = hit
                session.add(hit)
                session.add(job)

            session.add(group)
            session.commit()
            print "Video imported and ready for publication."
        finally:
            session.close()

class DumpCommand(Command):
    parent = argparse.ArgumentParser(add_help=False)
    parent.add_argument("slug")
    parent.add_argument("--interpolate", action="store_true", default=False)
    parent.add_argument("--merge", action="store_true", default=False)

    class Tracklet(object):
        def __init__(self, label, boxes):
            self.label = label
            self.boxes = sorted(boxes, key = lambda x: x.frame)

    def getdata(self, args):
        response = []
        session = database.connect()
        try:
            video = session.query(Video).filter(Video.slug == args.slug).one()
            for segment in video.segments:
                for job in segment.jobs:
                    for path in job.paths:
                        tracklet = DumpCommand.Tracklet(path.label.text,
                                                        path.getboxes())
                        response.append(tracklet)

            if args.interpolate:
                interpolated = []
                for track in response:
                    path = vision.track.interpolation.LinearFill(track.boxes)
                    tracklet = DumpCommand.Tracklet(track.label, path)
                    interpolated.append(tracklet)
                response = interpolated

            return video, response
        finally:
            session.close()

@handler("Highlights a video sequence")
class visualize(DumpCommand):
    def setup(self):
        parser = argparse.ArgumentParser(parents = [self.parent])
        parser.add_argument("output")
        return parser

    def __call__(self, args):
        print "Fetching data..."
        video, data = self.getdata(args)

        print "Processing {0} tracks...".format(len(data))
        paths = [x.boxes for x in data]
        
        print "Highlighting frames..."
        it = vision.visualize.highlight_paths(video, paths)
        vision.visualize.save(it, lambda x: "{0}/{1}.jpg".format(args.output, x))

@handler("Dumps the tracking data")
class dump(DumpCommand):
    def setup(self):
        parser = argparse.ArgumentParser(parents = [self.parent])
        parser.add_argument("--output", "-o")
        parser.add_argument("--xml", "-x", action="store_true", default=False)
        return parser

    def __call__(self, args):
        file = sys.stdout
        if args.output:
            file = open(args.output, 'w')

        video, data = self.getdata(args)

        if args.xml:
            self.dumpxml(file, data)
        else:
            self.dumptext(file, data)

        if args.output:
            file.close()

    def dumpxml(self, file, data):
        file.write("<annotations count=\"{0}\">\n".format(len(data)))
        for id, track in enumerate(data):
            file.write("\t<track id=\"{0}\" label=\"{1}\">\n".format(id, track.label))
            for box in track.boxes:
                file.write("\t\t<box frame=\"{0}\">\n".format(box.frame))
                file.write("\t\t\t<xtl>{0}</xtl>\n".format(box.xtl))
                file.write("\t\t\t<ytl>{0}</ytl>\n".format(box.ytl))
                file.write("\t\t\t<xbr>{0}</xbr>\n".format(box.xbr))
                file.write("\t\t\t<ybr>{0}</ybr>\n".format(box.ybr))
                file.write("\t\t\t<outside>{0}</outside>\n".format(box.lost))
                file.write("\t\t\t<occluded>{0}</occluded>\n".format(box.occluded))
                file.write("\t\t</box>\n")
            file.write("\t</track>\n")
        file.write("</annotations>\n")

    def dumptext(self, file, data):
        for id, track in enumerate(data):
            for box in track.boxes:
                file.write(str(id))
                file.write(" ")
                file.write(str(box.xtl))
                file.write(" ")
                file.write(str(box.ytl))
                file.write(" ")
                file.write(str(box.xbr))
                file.write(" ")
                file.write(str(box.ybr))
                file.write(" ")
                file.write(str(box.frame))
                file.write(" ")
                file.write(str(box.lost))
                file.write(" ")
                file.write(str(box.occluded))
                file.write(" \"")
                file.write(track.label)
                file.write("\"\n")
