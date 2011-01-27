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
            backgroundColor: this.color,
            zIndex: 1
        }).hide();

        this.hcrosshair.css({
            height: '2px',
            width: '100%',
            position: 'relative',
            top: '0px',
            left: '0px',
            backgroundColor: this.color,
            zIndex: 1
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
            var offset = this.container.offset();
            this.handle.css({
                "top": pos.ytl + offset.top + "px",
                "left": pos.xtl + offset.left + "px",
                "width": (pos.width - 3) + "px",
                "height": (pos.height - 3)+ "px",
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

    var respondtoclick = function(e) {
        var offset = container.offset();
        me.click(e.pageX - offset.left, e.pageY - offset.top);
    };

    var ignoremouseup = false;

    container.mousedown(function(e) {
        ignoremouseup = true;
        window.setTimeout(function() { 
            ignoremouseup = false;
        }, 500);

        respondtoclick(e);
    });

    container.mouseup(function(e) {
        if (!ignoremouseup)
        {
            respondtoclick(e);
        }
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

var track_collection_dump = null;

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

    player.onpause.push(function() {
        for (var i in me.tracks)
        {
            //me.tracks[i].recordposition();
        }
    });

    // if the window moves, we have to update boxes
    $(window).resize(function() {
        me.update(me.player.frame);
    });

    /*
     * Creates a new object.
     */
    this.add = function(frame, position, color)
    {
        var track = new Track(this.player, color);
        track.journal.mark(frame, position);
        track.draw(this.player.frame);

        this.tracks.push(track);

        console.log("Added new track");

        for (var i = 0; i < this.onnewobject.length; i++)
        {
            this.onnewobject[i](track);
        }

        return track;
    }

    /*
     * Changes the draggable functionality. If true, allow dragging, otherwise disable.
     */
    this.draggable = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].draggable(value);
        }
    }

    /*
     * Changes the resize functionality. If true, allow resize, otherwise disable.
     */
    this.resizable = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].resizable(value);
        }
    }

    /*
     * Changes the visibility on the boxes. If true, show boxes, otherwise hide.
     */
    this.visible = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].visible(value);
        }
    }

    /*
     * Changes the opacity on the boxes.
     */
    this.dim = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].dim(value);
        }
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
        if (this.tracks.length == 0)
        {
            return "[]";
        }

        var str = "[";
        for (var i in this.tracks)
        {
            str += this.tracks[i].serialize() + ",";
        }
        return str.substr(0, str.length - 1) + "]";
    }

    track_collection_dump = function() {
        return me.serialize();
    };
}

/*
 * A track class.
 */
function Track(player, color)
{
    var me = this;

    this.journal = new Journal();
    this.label = null;
    this.player = player;
    this.handle = null;
    this.color = color;
    this.htmloffset = 3;

    this.journal.mark(this.player.job.start,
        new Position(0, 0, 0, 0, false, true));

    this.journal.mark(this.player.job.stop,
        new Position(0, 0, 0, 0, false, true));

    /*
     * Polls the on screen position of the box and returns it.
     */
    this.pollposition = function()
    {
        var pos = this.handle.position();
        var width = this.handle.width();
        var height = this.handle.height();
        var offset = this.player.handle.offset();

        var xtl = pos.left - offset.left;
        var ytl = pos.top - offset.top;
        var xbr = xtl + width + this.htmloffset;
        var ybr = ytl + height + this.htmloffset;

        var estimate = this.journal.estimate(this.player.frame);
        var position = new Position(xtl, ytl, xbr, ybr)
        position.occluded = estimate.occluded;
        position.outside = estimate.outside;
        return position;
    }

    /*
     * Polls the on screen position and marks it in the journal.
     */
    this.recordposition = function()
    {
        this.journal.mark(this.player.frame, this.pollposition());
    }

    /*
     * Fixes the position to force box to be inside frame.
     */
    this.fixposition = function()
    {
        var width = this.player.job.width;
        var height = this.player.job.height;
        var pos = this.pollposition();

        if (pos.xtl > width)
        {
            pos = new Position(width - pos.width, pos.ytl, width, pos.ybr);
        }
        if (pos.ytl > height)
        {
            pos = new Position(pos.xtl, height - pos.height, pos.xbr, height);
        }
        if (pos.xbr < 0)
        {
            pos = new Position(0, pos.ytl, pos.width, pos.ybr);
        }
        if (pos.ybr < 0)
        {
            pos = new Position(pos.xtl, 0, pos.xbr, pos.height);
        }

        var xtl = Math.max(pos.xtl, 0);
        var ytl = Math.max(pos.ytl, 0); 
        var xbr = Math.min(pos.xbr, width - 1);
        var ybr = Math.min(pos.ybr, height - 1);

        var fpos = new Position(xtl, ytl, xbr, ybr);
        fpos.occluded = pos.occluded;
        fpos.outside = pos.outside;

        this.draw(this.player.frame, fpos);
    }

    /*
     * Sets the current position as occluded.
     */
    this.setocclusion = function(value)
    {
        if (value)
        {   
            console.log("Marking object as occluded here.");
        }
        else
        {
            console.log("Marking object as not occluded here.");
        }

        var pos = this.journal.estimate(this.player.frame);
        if (pos == null)
        {
            pos = this.pollposition();
        }
        pos = pos.clone();
        pos.occluded = value;
        this.journal.mark(this.player.frame, pos);
        this.draw(this.player.frame, pos);
    }

    /*
     * Sets the current position as outside.
     */
    this.setoutside = function(value)
    {
        if (value)
        {   
            console.log("Marking object as outside here.");
        }
        else
        {
            console.log("Marking object as not outside here.");
        }

        var pos = this.journal.estimate(this.player.frame);
        if (pos == null)
        {
            pos = this.pollposition();
        }
        pos = pos.clone();
        pos.outside = value;
        this.journal.mark(this.player.frame, pos);
        this.draw(this.player.frame, pos);
    }

    /*
     * Draws the current box on the screen. 
     */
    this.draw = function(frame, position)
    {
        if (this.handle == null)
        {
            this.handle = $('<div class="boundingbox"></div>');
            this.handle.css("border-color", this.color);
            var fill = $('<div class="fill"></div>').appendTo(this.handle);
            fill.css("background-color", this.color);
            this.player.handle.append(this.handle);

            this.handle.resizable({
                handles: "n,w,s,e",
                start: function() {
                    player.pause();
                },
                stop: function() {
                    me.fixposition();
                    me.recordposition();
                }
            });

            this.handle.draggable({
                start: function() {
                    player.pause();
                },
                stop: function() { 
                    me.fixposition();
                    me.recordposition();                
                }
            });
        }

        if (position == null)
        {
            position = this.journal.estimate(frame);
        }

        if (position.outside)
        {
            this.handle.hide();
            return;
        }

        this.handle.show();
        
        if (position.occluded)
        {
            this.handle.addClass("boundingboxoccluded");
        }
        else
        {
            this.handle.removeClass("boundingboxoccluded");
        }

        var offset = this.player.handle.offset();

        this.handle.css({
            top: position.ytl + offset.top + "px",
            left: position.xtl + offset.left + "px",
            width: (position.width - this.htmloffset) + "px",
            height: (position.height - this.htmloffset) + "px"
        });

    }

    this.draggable = function(value)
    {
        if (value)
        {
            this.handle.draggable("option", "disabled", false);
        }
        else
        {
            this.handle.draggable("option", "disabled", true);
        }
    }

    this.resizable = function(value)
    {
        if (value)
        {
            this.handle.resizable("option", "disabled", false);
        }
        else
        {
            this.handle.resizable("option", "disabled", true);
        }
    }   

    this.visible = function(value)
    {
        if (value)
        {
            this.handle.hide();
        }
        else
        {
            this.handle.show();
        }
    }

    /*
     * Dims the visibility of the box.
     */
    this.dim = function(value)
    {
        if (value)
        {
            this.handle.addClass("boundingboxdim");
        }
        else
        {
            this.handle.removeClass("boundingboxdim");
        }
    }

    /*
     * Highlights a box.
     */
    this.highlight = function(value)
    {
        if (value)
        {
            this.handle.addClass("boundingboxhighlight");
        }
        else
        {
            this.handle.removeClass("boundingboxhighlight");
        }
    }

    /*
     * Serializes the tracks.
     */
    this.serialize = function()
    {
        return "[" + this.label + "," + this.journal.serialize() + "]";
    }

    /*
     * Removes the box.
     */
    this.remove = function()
    {
        this.handle.fadeOut(null, function() {
            me.handle.remove();
        });
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
        console.log("Marking " + frame);
        this.annotations[frame] = position;
    }

    /*
     * Estimates the position of the box for visualization purposes.
     * If the frame was annotated, returns that position, otherwise
     * attempts to interpolate or extrapolate.
     */
    this.estimate = function(frame)
    {
        var bounds = this.bounds(frame);
        if (bounds['leftframe'] == bounds['rightframe'])
        {
            return bounds['left'];
        }

        if (bounds['left'] == null || bounds['left'].outside)
        {
            return bounds['right'];
        }

        if (bounds['right'] == null || bounds['right'].outside)
        {
            return bounds['left'];
        }

        var fdiff = bounds['rightframe'] - bounds['leftframe'];
        var xtlr = (bounds['right'].xtl - bounds['left'].xtl) / fdiff;
        var ytlr = (bounds['right'].ytl - bounds['left'].ytl) / fdiff;
        var xbrr = (bounds['right'].xbr - bounds['left'].xbr) / fdiff;
        var ybrr = (bounds['right'].ybr - bounds['left'].ybr) / fdiff;

        var off = frame - bounds['leftframe'];
        var xtl = bounds['left'].xtl + xtlr * off;
        var ytl = bounds['left'].ytl + ytlr * off;
        var xbr = bounds['left'].xbr + xbrr * off;
        var ybr = bounds['left'].ybr + ybrr * off;

        var occluded = false;
        var outside = false;

//        if (Math.abs(bounds['rightframe'] - frame) > Math.abs(bounds['leftframe'] - frame))
//        {
//            occluded = bounds['right'].occluded;
//            outside = bounds['right'].outside;
//        }
//        else
//        {
            occluded = bounds['left'].occluded;
            outside = bounds['left'].outside;
//        }

        return new Position(xtl, ytl, xbr, ybr, occluded, outside);
    }
    
    this.bounds = function(frame)
    {
        if (this.annotations[frame])
        {
            var item = this.annotations[frame];
            return {'left': item,
                    'leftframe': frame,
                    'right': item,
                    'rightframe': frame};
        }

        var left = null;
        var right = null;
        var lefttime = 0;
        var righttime = 0;

        for (t in this.annotations)
        {
            var item = this.annotations[t];
            itemtime = parseInt(t);

            if (itemtime <= frame)
            {
                if (left == null || itemtime > lefttime) 
                {
                    left = item;
                    lefttime = itemtime;;
                }
            }
            else
            {
                if (right == null || itemtime < righttime)
                {
                    right = item;
                    righttime = itemtime;
                }
            }
        }

        return {'left': left,
                'leftframe': lefttime,
                'right': right,
                'rightframe': righttime};
    }

    /*
     * Serializes this journal based on position.
     */
    this.serialize = function()
    {
        if (this.annotations.length == 0)
        {
            return "{}";
        }

        str = "{";
        for (var frame in this.annotations)
        {
            var dat = this.annotations[frame];
            str += "\"" + frame + "\":" + dat.serialize() + ",";
        }
        return str.substr(0, str.length - 1) + "}";
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

    this.serialize = function()
    {
        return "[" + this.xtl + "," +
                     this.ytl + "," +
                     this.xbr + "," +
                     this.ybr + "," +
                     this.occluded + "," +
                     this.outside + "]";
    }

    this.clone = function()
    {
        return new Position(this.xtl,
                            this.ytl,
                            this.xbr,
                            this.ybr,
                            this.occluded,
                            this.outside);
    }
}
