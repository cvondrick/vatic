/*
 * var videoplayer = VideoPlayer($("#frame"), 1000,
 *                   function (x) { return "/images/" + x + ".jpg"; });
 * videoplayer.play();
 */
function VideoPlayer(handle, job)
{
    var me = this;

    this.handle = handle;
    this.job = job;
    this.frame = job.start;
    this.paused = true;
    this.fps = 30;
    this.playdelta = 1;

    this.onplay = []; 
    this.onpause = []; 
    this.onupdate = [];

    /*
     * Toggles playing the video. If playing, pauses. If paused, plays.
     */
    this.toggle = function()
    {
        if (this.paused)
        {
            this.play();
        }
        else
        {
            this.pause();
        }
    }

    /*
     * Starts playing the video if paused.
     */
    this.play = function()
    {
        if (this.paused)
        {
            console.log("Playing...");
            this.paused = false;
            this.interval = window.setInterval(function() {
                if (me.frame >= me.job.stop)
                {
                    me.pause();
                }
                else
                {
                    me.displace(me.playdelta);
                }
            }, 1. / this.fps * 1000);

            this._callback(this.onplay);
        }
    }

    /*
     * Pauses the video if playing.
     */
    this.pause = function()
    {
        if (!this.paused)
        {
            console.log("Paused.");
            this.paused = true;
            window.clearInterval(this.interval);
            this.interval = null;

            this._callback(this.onpause);
        }
    }

    /*
     * Seeks to a specific video frame.
     */
    this.seek = function(target)
    {
        this.frame = target;
        this.updateframe();
    }

    /*
     * Displaces video frame by a delta.
     */
    this.displace = function(delta)
    {
        this.frame += delta;
        this.updateframe();
    }

    /*
     * Updates the current frame. Call whenever the frame changes.
     */
    this.updateframe = function()
    {
        this.frame = Math.min(this.frame, this.job.stop);
        this.frame = Math.max(this.frame, this.job.start);

        var url = this.job.frameurl(this.frame);
        this.handle.css("background-image", "url('" + url + "')");

        this._callback(this.onupdate);
    }

    /*
     * Calls callbacks
     */
    this._callback = function(list)
    {
        for (var i = 0; i < list.length; i++)
        {
            list[i]();
        }
    }

    this.updateframe();
}
