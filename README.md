# Please Note

Intel has created an excellent annotation tool with the latest technologies. https://github.com/opencv/cvat 

This project is archived, and no further updates are expected.

July 2020

# VATIC - Video Annotation Tool from Irvine, California



VATIC is an online video annotation tool for computer vision research that
crowdsources work to Amazon's Mechanical Turk. Our tool makes it easy to build
massive, affordable video data sets. 

<img src='http://i.imgur.com/z6jl5Bs.jpg'>

# INSTALLATION 

Note: VATIC has only been tested on Ubuntu with Apache 2.2 HTTP server and a
MySQL server. This document will describe installation on this platform,
however it should work any operating system and with any server.

## Download

You can download and extract VATIC from our website. Note: do NOT run the 
installer as root. 

    $ wget http://mit.edu/vondrick/vatic/vatic-install.sh
    $ chmod +x vatic-install.sh
    $ ./vatic-install.sh
    $ cd vatic

## HTTP Server Configuration 

Open the Apache configuration file. On Ubuntu, this file is located at:

    /etc/apache2/sites-enabled/000-default

If you do not use Apache on this computer for any other purpose, replace the
contents of the file with:

    WSGIDaemonProcess www-data
    WSGIProcessGroup www-data

    <VirtualHost *:80>
        ServerName vatic.domain.edu
        DocumentRoot /path/to/vatic/public

        WSGIScriptAlias /server /path/to/vatic/server.py
        CustomLog /var/log/apache2/access.log combined
    </VirtualHost>

updating ServerName with your domain name, DocumentRoot with the path to
the public directory in VATIC, and WSGIScriptAlias to VATIC's server.py file.

If you do use Apache for other purposes, you will have to setup a new virtual
host with the correct document root and script alias, as shown above.

Make sure you have the mod_headers module enabled:

    $ sudo cp /etc/apache2/mods-available/headers.load /etc/apache2/mods-enabled

After making these changes, restart Apache:

    $ sudo apache2ctl graceful

## SQL Server Configuration 

We recommend creating a separate database specifically for VATIC:

    $ mysql -u root
    mysql> create database vatic;

The next section will automatically create the necessary tables.

## Setup

Inside the vatic directory, copy config.py-example to config.py:

    $ cp config.py-example config.py

Then open config.py and make changes to the following variables in order to
configure VATIC:

    signature       Amazon Mechanical Turk AWS signature (secret access key)
    accesskey       Amazon Mechanical Turk AWS access key (access key ID)
    sandbox         If true, put into Mturk sandbox mode. For debugging.
    localhost       The local HTTP address: http://vatic.domain.edu/ so it
                    matches the ServerName in Apache.
    database        Database connection string: for example,
                    mysql://user:pass@localhost/vatic
    geolocation     API key from ipinfodb.com for geolocation services

If you do not plan on using VATIC on Mechcanical Turk (offlien mode only), you
can leave the signature and accesskey empty.

After saving results, you can then initialize the database:

    $ turkic setup --database

Note: if you want to reset the database, you can do this with:

    $ turkic setup --database --reset

which will require confirmation to reset in order to prevent data loss.

Finally, you must also allow VATIC to access turkic, a major dependency:

    $ turkic setup --public-symlink

# ANNOTATION 

Before you continue, you should verify that the installation was correct. You
can verify this with:

    $ turkic status --verify

If you receive any error messages, it means the installation was not complete
and you should review the previous section. Note: If you do not plan on
using Mechanical Turk, you can safely ignore any errors caused by Mechanical
Turk.

## Frame Extraction 

Our system requires that videos are extracted into JPEG frames. Our tool can 
do this automatically for you:

    $ mkdir /path/to/output/directory
    $ turkic extract /path/to/video.mp4 /path/to/output/directory

By default, our tool will resize the frames to fit within a 720x480 rectangle.
We believe this resolution is ideal for online video viewing. You can change 
resolution with options:

    $ turkic extract /path/to/video.mp4 /path/to/output/directory
      --width 1000 --height 1000

or

    $ turkic extract /path/to/video.mp4 /path/to/output/directory
      --no-resize

The tool will maintain aspect ratio in all cases.

Alternatively, if you have already extracted frames, you can use the
formatframes command to format the video into a format that VATIC understands:

    $ turkic formatframes /path/to/frames/ /path/to/output/directory

The above command will read all the images in /path/to/frames and create
hard links (soft copy) in /path/to/output/directory.

## Importing a Video

After extracting frames, the video can be imported into our tool for 
annotation. The general syntax for this operation is:

    $ turkic load identifier /path/to/output/directory Label1 Label2 LabelN

where identifier is a unique string that you will use to refer to this video,
/path/to/output/directory is the directory of frames, and LabelX are class
labels that you want annotated (e.g., Person, Car, Bicycle). You can have as
many class labels as you wish, but you must have at least one.

When a video is imported, it is broken into small segments typically of only a
few seconds. When all the segments are annotated, the annotations are merged
across segments because each segment overlaps another by a small margin.

The above command specifies all of the required options, but there are many
options available as well. We recommend using these options.

    MTurk Options
        --title         The title that MTurk workers see
        --description   The description that MTurk workers see
        --duration      Time in seconds that a worker has to complete the task
        --lifetime      Time in seconds that the task is online
        --keywords      Keywords that MTurk workers can search on
        --offline       Disable MTurk and use for self annotation only

    Compensation Options
        --cost                  The price advertised to MTurk workers
        --per-object-bonus      A bonus in dollars paid for each object
        --completion-bonus      A bonus in dollars paid for completing the task

    Qualification Options
        --min-approved-percent  Minimum percent of tasks the worker must have
                                approved before they can work for you
        --min-approved-amount   Minimum number of tasks that the worker must 
                                have completed before they can work for you

    Video Options
        --length        The length of each segment for this video in frames
        --overlap       The overlap between segments in frames
        --use-frames    When splitting into segments, only the frame intervals
                        specified in this file. Each line should contain a
                        start frame, followed by a space, then the stop frame.
                        Frames outside the intervals in this file will be
                        ignored.
        --skip          If specified, request annotations only every N frames.
        --blow-radius   When a user marks an annotation, blow away all other
                        annotations within this many frames. If you want to
                        allow the user to make fine-grained annotations, set
                        this number to a small integer, or 0 to disable. By
                        default, this is 5, which we recommend.

You can also specify temporal attributes that each object label can take on.
For example, you may have a person object with attributes "walking", "running",
or "sitting". You can specify attributes the same way as labels, except you
prepend an ~ before the text, which bind the attribute to the previous label:

    $ turkic load identifier /path/to/output/directory Label1 ~Attr1A ~Attr1B
      Label2 ~Attr2A ~Attr2B ~Attr2C Label3 

In the above example, Label1 will have attributes Attr1A and Attr1B, Label2
will have attributes Attr2B, Attr2B, and Attr2C and Label3 will have no 
attributes. Specifying attributes is optional.

## Gold Standard Training 

It turns out that video annotation is extremely challenging and most MTurk
workers lack the necessary patience. For this reason, we recommend requiring
workers to pass a "gold standard" video. When a new worker visits the task,
they will be redirected to a video for which the annotations are already known.
In order to move on to the true annotations, the worker must correctly annotate
the gold standard video first. We have found that this approach significantly
improves the quality of the annotations.

To use this feature, import a video to be used as the gold standard:

    $ turkic load identifier-train /path/to/frames Label1 Label2 LabelN
      --for-training --for-training-start 0 --for-training-stop 500
      --for-training-overlap 0.5 --for-training-tolerance 0.1
      --for-training-mistakes 1

You can also use any of the options described above. Explanations for the new
options are as follows:

    --for-training              Specifies that this video is gold standard
    --for-training-start        Specifies the first frame to use
    --for-training-stop         Specifies the last frame to use
    --for-training-overlap      Percent overlap that worker's boxes must match 
    --for-training-tolerance    Percent that annotations must agree temporally
    --for-training-mistakes     The number of completely wrong annotations 
                                allowed. We recommend setting this to a small,
                                nonzero integer.

After running the above command, it will provide you with an URL for you to
input the ground truth annotation. You must make this ground truth annotation
as careful as possible, as it will be used to evaluate future workers.

You can now specify that a video should use a gold standard video:

    $ turkic load identifier /path/to/output/directory Label1 Label2 LabelN
      --train-with identifier-train

When a not-yet-seen worker visits this video, they will now be redirected to
to the training video and be required to pass the evaluation test first.

## Publishing Tasks 

When you are ready for the MTurk workers to annotate, you must publish the 
tasks, which will allow workers to start annotating:
    
    $ turkic publish

You can limit the number of tasks that are published:

    $ turkic publish --limit 100

Running above command repeatedly will launch tasks in batches of 100. You can
also disable all pending tasks:
    
    $ turkic publish --disable

which will "unpublish" tasks that have not yet been completed.

If you have videos that are offline only, you can see their access URLs with
the command:

    $ turkic publish --offline

Note: for the above command to work, you must have loaded the video with the
--offline parameter as well: 

    $ turkic load identifier /path/to/frames Person --offline

## Checking the Status 

You can check the status of the video annotation server with the command:

    $ turkic status

This will list various statistics about the server, such as number of jobs
published and how many are completed. You can get even more statistics by
requesting additional information from Amazon:

    $ turkic status --turk

which will output how much money is left in your account, among other
statistics.

When all the videos are annotated, the last line will read:

    Server is offline.

## Retrieving Annotations

You can get all the annotations for a video with the command:

    $ turkic dump identifier -o output.txt

which will write the file "output.txt" where each line contains one
annotation. Each line contains 10+ columns, separated by spaces. The
definition of these columns are:

    1   Track ID. All rows with the same ID belong to the same path.
    2   xmin. The top left x-coordinate of the bounding box.
    3   ymin. The top left y-coordinate of the bounding box.
    4   xmax. The bottom right x-coordinate of the bounding box.
    5   ymax. The bottom right y-coordinate of the bounding box.
    6   frame. The frame that this annotation represents.
    7   lost. If 1, the annotation is outside of the view screen.
    8   occluded. If 1, the annotation is occluded.
    9   generated. If 1, the annotation was automatically interpolated.
    10  label. The label for this annotation, enclosed in quotation marks.
    11+ attributes. Each column after this is an attribute.

By default, the above command will not attempt to merge annotations across
shot segments. You can request merging with the command:

    $ turkic dump identifier -o output.txt --merge --merge-threshold 0.5

The --merge-threshold option is optional, but it is a number between 0 and 1
that represents much the paths must agree in order to merge. 1 specifies a
perfect match and 0 specifies no match. In practice, 0.5 is sufficient. Merging
is done using the Hungarian algorithm.

You can also scale annotations by a factor, which is useful for when the
videos have been downsampled:

    $ turkic dump identifier -o output.txt -s 2.8

or force it to fit within a max dimension:

    $ turkic dump identifier -o output.txt --dimensions 400x200

or force it to fit within the dimensions of the original video:

    $ turkic dump identifier -o output.txt --original-video /path/to/video.mp4

The command can also output to many different formats. Available formats are:

    --xml       Use XML
    --json      Use JSON
    --matlab    Use MATLAB
    --pickle    Use Python's Pickle
    --labelme   Use LabelMe video's XML format
    --pascal    Use PASCAL VOC format, treating each frame as an image

The specifications for these formats should be self explanatory.

## Visualizing Videos 

You can preview the annotations by visualizing the results:

    $ turkic visualize identifier /tmp --merge

which will output frames to /tmp with the bounding boxes with the file name
as the frame number. The visualization will contain some meta information
that can help you identify bad workers. You can remove this meta information
with the option:

    $ turkic visualize identifer /tmp --merge --no-augment

If you want to make a video of the visualization (e.g., with ffmpeg), it is
useful to renumber the frames so that they start counting at 0 and do not
have any gaps:

    $ turkic visualize identifier /tmp --merge --renumber

If you wish to display the class label and their attributes next to the box,
specify the --labels option:

    $ turkic visualize identifier /tmp --labels

## Compensating Workers 

When you are ready, you can compensate workers:

    $ turkic compensate --default accept

which will pay all workers for all outstanding tasks. We strongly recommend
paying all workers regardless of their quality. You should attempt to pay
workers at least once per day.

## Finding Jobs 

If you have found a small mistake in a video and want to make
the correction yourself, you can start an annotation session initialized with
the MTurk workers annotations:

    $ turkic find --id identifier
    $ turkic find --id identifier --frame frame

where identifier is the identifier for the video and frame is the frame number
that the error occurs. In most cases, this command will return one URL for you
to make the corrections. If it outputs two URLs, it means the frame number
occurs in two overlapping segments, and so you may have to make changes to both
of the segments. You can also omit the frame argument, in which case it will
output all URLs for that video.

If you want to find the HIT id, assignment ID, or worker ID for a particular
video, specify the --ids parameter to the vet command:

    $ turkic find --id identifer --ids
    $ turkic find --id identifer --frame frame --ids

will print a list of all the IDs for the video. If the corresponding segment
has been published and completed, it will list three strings: the HIT ID,
assignment ID, and the worker ID. If the job has been published but not
finished, it will just list the HIT ID. If the job has not yet been published,
it prints "(not published)".

Additionally, if you want to find the job that corresponds to a particular
HIT ID, you can use the find command:

    $ turkic find --hitid HITID

## Quality Control 

The gold standard does a "pretty good" job of weeding out bad workers.
Nonetheless, there will always be bad workers that we must identify and
invalidate. Our tool provides a method to sample the annotations provided by
workers, which you can then manually verify for correctness:

    $ turkic sample /tmp

which by default will pick 3 random videos that the worker has completed, and
pick 4 random frames from each of those videos, and write visualiations to a
file in /tmp. You can tweak the number of videos and the number of frames with
the options:

    $ turkic sample /tmp --number 3 --frames 4

Moreover, you can only look at work from a certain date:

    $ turkic sample /tmp --since "yesterday"

The filename will follow the format of WORKERID-JOBID.jpg. Once you have
identified a mallicious worker, you can block them, invalidate ALL of their
work, and respawn their jobs with the command:

    $ turkic invalidate workerid

The options are also available:

    --no-block      invalidate and respawn, but don't block
    --no-publish    block and invalidate, but don't respawn

You can also invalidate and respawn individual jobs with the command:

    $ turkic invalidate --hit hitid

## Listing all Videos 

You can retrieve a list of all videos in the system with:

    $ turkic list

If you want just the videos that have been published:

    $ turkic list --published

If you want just the videos that have been worked on:

    $ turkic list --completed

If you instead want the videos that are used for gold standard:

    $ turkic list --training

Finally, if you just want to count how many videos are in the system, use the
--count option, in combination with any of the above:

    $ turkic list --count
    $ turkic list --published --count

If you want statistics about each video, then give the --stats option:

    $ turkic list --stats

## Managing Workers 

You can list all known workers with the command:

    $ turkic workers

which will dump every worker with the number of jobs they have completed. You
can also use this command to block and unblock workers:

    $ turkic workers --block workerid
    $ turkic workers --unblock workerid

You can also search for workers by the first few letters of their ID:

    $ turkic workers --search A3M

## Deleting a Video 

You can delete a video at any time with:

    $ turkic delete identifier

If the video has already been annotated (even partially), this command will 
warn you and abort. You can force deletion with:

    $ turkic delete identifier --force

which will REMOVE ALL DATA AND CANNOT BE UNDONE.

# REFERENCES 

When using our system, please cite:

    Carl Vondrick, Donald Patterson, Deva Ramanan. "Efficiently Scaling Up
    Crowdsourced Video Annotation" International Journal of Computer Vision
    (IJCV). June 2012.

# FEEDBACK AND BUGS 

Please direct all comments and report all bugs to:

    Carl Vondrick
    vondrick@mit.edu

Thanks for using our system!
