/*
 * Allows the user to draw a box on the screen.
 */
function BoxDrawer(container)
{
    var me = this;

    this.onstartdraw = [];
    this.onstopdraw = []

    this.enabled = false;
    this.drawing = false;

    this.startx = 0;
    this.starty = 0;

    this.container = container;
    this.handle = null;
    this.color = null;

    this.vcrosshair = null;
    this.hcrosshair = null;

    /*
     * Enables the drawer.
     */
    this.enable = function()
    {
        this.enabled = true;

        this.container.css({
            'cursor': 'crosshair'
        });

        this.hcrosshair = $('<div></div>').appendTo(this.container);
        this.vcrosshair = $('<div></div>').appendTo(this.container);

        this.vcrosshair.css({
            width: '2px',
            height: '100%',
            position: 'relative',
            top: '0px',
            left: '0px',
            backgroundColor: this.color
        }).hide();

        this.hcrosshair.css({
            height: '2px',
            width: '100%',
            position: 'relative',
            top: '0px',
            left: '0px',
            backgroundColor: this.color
        }).hide();
    }

    /*
     * Disables the drawer. No boxes can be drawn and interface cues are
     * disabled.
     */
    this.disable = function()
    {
        this.enabled = false;

        this.container.css({
            'cursor': 'default'
        });

        this.vcrosshair.remove();
        this.hcrosshair.remove();
    }

    /*
     * Method called when we receive a click on the target area.
     */
    this.click = function(xc, yc)
    {
        if (this.enabled)
        {
            if (!this.drawing)
            {
                this.startdrawing(xc, yc);
            }
            else
            {
                this.finishdrawing(xc, yc);
            }
        }
    }

    /*
     * Updates the current visualization of the current box.
     */
    this.updatedrawing = function(xc, yc)
    {
        if (this.drawing)
        {
            var pos = this.calculateposition(xc, yc);
            this.handle.css({
                "top": pos.ytl + "px",
                "left": pos.xtl + "px",
                "width": pos.width + "px",
                "height": pos.height + "px",
                "border-color": this.color
            });
        }
    }

    /*
     * Updates the cross hairs.
     */
    this.updatecrosshairs = function(visible, xc, yc)
    {
        if (this.enabled)
        {
            if (visible && !this.drawing)
            {
                this.vcrosshair.show().css('left', xc + 'px');
                this.hcrosshair.show().css('top', yc + 'px');
            }
            else
            {
                this.vcrosshair.hide();
                this.hcrosshair.hide();
            }
        }
    }

    /*
     * Calculates the position of the box given the starting coordinates and
     * some new coordinates.
     */
    this.calculateposition = function(xc, yc)
    {
        var xtl = Math.min(xc, this.startx);
        var ytl = Math.min(yc, this.starty);
        var xbr = Math.max(xc, this.startx);
        var ybr = Math.max(yc, this.starty);
        return new Position(xtl, ytl, xbr, ybr)
    }

    /*
     * Starts drawing a box.
     */
    this.startdrawing = function(xc, yc)
    {
        if (!this.drawing)
        {
            console.log("Starting new drawing");

            this.startx = xc;
            this.starty = yc;

            this.drawing = true;

            this.handle = $('<div class="boundingbox"><div>');
            this.updatedrawing(xc, yc);
            this.container.append(this.handle);

            for (var i in this.onstartdraw)
            {
                this.onstartdraw[i]();
            }
        }
    }

    /*
     * Completes drawing the box. This will remove the visualization, so you will 
     * have to redraw it.
     */
    this.finishdrawing = function(xc, yc)
    {
        if (this.drawing)
        {
            console.log("Finishing drawing");

            var position = this.calculateposition(xc, yc);

            // call callbacks
            for (var i in this.onstopdraw)
            {
                this.onstopdraw[i](position);
            }

            this.drawing = false;
            this.handle.remove();
            this.startx = 0;
            this.starty = 0;
        }
    }
    
    /*
     * Cancels the current drawing.
     */
    this.canceldrawing = function()
    {
        if (this.drawing)
        {
            console.log("Cancelling drawing");
            this.drawing = false;
            this.handle.remove();
            this.startx = 0;
            this.starty = 0;
        }
    }

    container.click(function(e) {
        var offset = container.offset();
        me.click(e.pageX - offset.left, e.pageY - offset.top);
        e.stopPropagation();
    });

    container.mousemove(function(e) {
        var offset = container.offset();
        var xc = e.pageX - offset.left;
        var yc = e.pageY - offset.top;

        me.updatedrawing(xc, yc);
        me.updatecrosshairs(true, xc, yc);
    });

    $("body").click(function(e) {
        me.canceldrawing();
    });
}

/*
 * A collection of tracks.
 */
function TrackCollection(player, job)
{
    var me = this;

    this.player = player;
    this.job = job;
    this.tracks = [];

    this.onnewobject = []; 

    player.onupdate.push(function() {
        me.update(player.frame);
    });

    /*
     * Creates a new object.
     */
    this.add = function(position, color)
    {
        var track = Track(this.player.handle, color);
        track.journal.mark(this.player.frame, position);
        tracks.push(track);

        for (var i = 0; i < this.onnewobject.length; i++)
        {
            this.onnewobject[i](track);
        }

        return track;
    }

    /*
     * Changes the resize functionality. If true, allow resize, otherwise disable.
     */
    this.allowresize = function(value)
    {
    }

    /*
     * Changes the visibility on the boxes. If true, show boxes, otherwise hide.
     */
    this.boxesvisible = function(value)
    {
    }

    /*
     * Updates boxes with the given frame
     */
    this.update = function(frame)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].draw(frame);
        }
    }

    /*
     * Serializes all tracks for sending to server.
     */
    this.serialize = function()
    {
        var str = "[";
        for (var i in this.tracks)
        {
            str += this.tracks[i].serialize() + ",";
        }
        return str.substr(0, str.length - 1) + "]";
    }
}

/*
 * A track class.
 */
function Track(container, color)
{
    this.journal = new Journal();
    this.classification = null;
    this.container = container;
    this.handle = null;
    this.color = color;

    /*
     * Polls the on screen position of the box and returns it.
     */
    this.pollposition = function()
    {
        var pos = this.handle.position();
        var width = this.handle.width();
        var height = this.handle.height();
        var offset = this.container.offset();

        var xtl = pos.left - container.left;
        var ytl = pos.top - container.top;
        var xbr = xtl + width;
        var ybr = ytl + height;

        return new Position(xtl, ytl, xbr, ybr)
    }

    /*
     * Draws the current box on the screen. 
     */
    this.draw = function(frame)
    {
        if (this.handle == null)
        {
            this.handle = $('<div class="box"></div>');
            this.handle.css("border-color", this.color);
            this.container.append(this.handle);
        }

        var position = this.journal.estimate(frame);

        this.handle.css({
            top: position.ytl + "px",
            left: position.xtl + "px",
            width: position.width + "px",
            height: position.height + "px"
        });
    }

    /*
     * Serializes the tracks.
     */
    this.serialize = function()
    {
        return "[" + this.classification + "," + this.journal.serialize() + "]";
    }
}

/*
 * A journal to store a set of positions.
 */
function Journal()
{
    this.annotations = {};

    /*
     * Marks the boxes position.
     */
    this.mark = function(frame, position) 
    {
        this.annotations[frame] = position;
    }

    /*
     * Estimates the position of the box for visualization purposes.
     * If the frame was annotated, returns that position, otherwise
     * attempts to interpolate or extrapolate.
     */
    this.estimate = function(frame)
    {
    }

    /*
     * Serializes this journal based on position.
     */
    this.serialize = function()
    {
        for (var frame in this.annotations)
        {
            var dat = this.annotations[frame];
            str += "[" + frame + "," + dat.xtl + "," + dat.ytl + ",";
            str += dat.xbr + "," + dat.ybr + ",";
            str += dat.occluded + "," + dat.outside + "],";
        }
        return str.substr(0, str.length - 1);
    }
}

/*
 * A structure to store a position.
 * Occlusion and outside is optional.
 */
function Position(xtl, ytl, xbr, ybr, occluded, outside)
{
    this.xtl = xtl;
    this.ytl = ytl;
    this.xbr = xbr;
    this.ybr = ybr;
    this.occluded = occluded ? occluded : false;
    this.outside = outside ? outside : false;
    this.width = xbr - xtl;
    this.height = ybr - ytl;
}
