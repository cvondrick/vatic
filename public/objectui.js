function TrackObjectUI(button, container, videoframe, job, player, tracks)
{
    var me = this;

    this.button = button;
    this.container = container;
    this.videoframe = videoframe;
    this.job = job;
    this.player = player;
    this.tracks = tracks;

    this.drawer = new BoxDrawer(videoframe);

    this.counter = 0;

    this.currentobject = null;
    this.currentcolor = null;

    this.objects = [];

    this.startnewobject = function()
    {
        if (this.button.button("option", "disabled"))
        {
            return;
        }

        ui_disable();

        console.log("Starting new track object");

        eventlog("newobject", "Start drawing new object");

        this.instructions.fadeOut();

        this.currentcolor = this.pickcolor();
        this.drawer.color = this.currentcolor[0];
        this.drawer.enable();

        this.button.button("option", "disabled", true);

        this.currentobject = new TrackObject(this.job, this.player,
                                             this.container,
                                             this.currentcolor);
        this.currentobject.statedraw();

        this.tracks.resizable(false);
        this.tracks.draggable(false);
    }

    this.stopdrawing = function(position)
    {
        console.log("Received new track object drawing");

        var track = tracks.add(player.frame, position, this.currentcolor[0]);

        this.drawer.disable();
        
        this.currentobject.initialize(this.counter, track, this.tracks);
        this.currentobject.stateclassify();

        this.currentobject.onready.push(function() {
            me.stopnewobject();
        });
    }

    this.stopnewobject = function()
    {
        console.log("Finished new track object");

        ui_enable();

        this.objects.push(this.currentobject);

        this.tracks.draggable(true);
        if ($("#annotateoptionsresize:checked").size() == 0)
        {
            this.tracks.resizable(true);
        }
        else
        {
            this.tracks.resizable(false);
        }

        this.tracks.dim(false);
        this.currentobject.track.highlight(false);

        this.button.button("option", "disabled", false);

        this.counter++;
    }

    this.injectnewobject = function(label, path)
    {
        console.log("Injecting existing object");

        this.instructions.fadeOut();

        this.currentcolor = this.pickcolor();
        var obj = new TrackObject(this.job, this.player,
                                  container, this.currentcolor);

        function convert(box)
        {
            return new Position(box[0], box[1], box[2], box[3],
                                box[6], box[5]);
        }

        var track = tracks.add(path[0][4], convert(path[0]),
                               this.currentcolor[0]);
        for (var i = 1; i < path.length; i++)
        {
            track.journal.mark(path[i][4], convert(path[i]));
        }

        obj.initialize(this.counter, track, this.tracks);
        obj.finalize(label);
        obj.statefoldup();
        obj.updatecheckboxes();
        this.counter++;

        return obj;
    }

    this.setup = function()
    {
        this.button.button({
            icons: {
                primary: "ui-icon-plusthick",
            },
            disabled: false
        }).click(function() {
            me.startnewobject();
        });

        this.drawer.onstopdraw.push(function(position) {
            me.stopdrawing(position);
        });

        var html = "<p>In this video, please track all of these objects:</p>";
        html += "<ul>";
        for (var i in this.job.labels)
        {
            html += "<li>" + this.job.labels[i] + "</li>";
        }
        html += "</ul>";
        html += "<p>Click the above button to create your first annotation.</p>";

        this.instructions = $(html).appendTo(this.container);
    }

    this.disable = function()
    {
        for (var i in this.objects)
        {
            this.objects[i].disable();
        }
    }

    this.enable = function()
    {
        for (var i in this.objects)
        {
            this.objects[i].enable();
        }
    }

    this.setup();

    this.availcolors = [["#FF00FF", "#FFBFFF", "#FFA6FF"],
                        ["#FF0000", "#FFBFBF", "#FFA6A6"],
                        ["#FF8000", "#FFDCBF", "#FFCEA6"],
                        ["#FFD100", "#FFEEA2", "#FFEA8A"],
                        ["#008000", "#8FBF8F", "#7CBF7C"],
                        ["#0080FF", "#BFDFFF", "#A6D2FF"],
                        ["#0000FF", "#BFBFFF", "#A6A6FF"],
                        ["#000080", "#8F8FBF", "#7C7CBF"],
                        ["#800080", "#BF8FBF", "#BF7CBF"]];
    this.pickcolor = function()
    {
        return this.availcolors[this.availcolors.push(this.availcolors.shift()) - 1];
    }
}

function TrackObject(job, player, container, color)
{
    var me = this;

    this.job = job;
    this.player = player;
    this.container = container;
    this.color = color;

    this.id = null;
    this.track = null;
    this.tracks = null;
    this.label = null;

    this.onready = [];
    this.onfolddown = [];
    this.onfoldup = [];

    this.handle = $("<div class='trackobject'><div>");
    this.handle.prependTo(container);
    this.handle.css({
        'background-color': color[2],
        'border-color': color[2]});
    this.handle.mouseover(function() {
        me.mouseover();
    });
    this.handle.mouseout(function() {
        me.mouseout();
    });

    this.header = null;
    this.headerdetails = null;
    this.details = null;
    this.drawinst = null;
    this.classifyinst = null;
    this.opencloseicon = null;

    this.ready = false;
    this.foldedup = false;

    this.initialize = function(id, track, tracks)
    {
        this.id = id;
        this.track = track;
        this.tracks = tracks;

        this.track.onmouseover.push(function() {
            me.mouseover();
        });

        this.track.onmouseout.push(function() {
            me.mouseout();
        });

        this.track.onupdate.push(function() {
            eventlog("interact", "Interact with box " + me.id);
        });

        this.track.notifyupdate();
        eventlog("newobject", "Finished drawing new object");
    }

    this.remove = function()
    {
        this.handle.slideUp(null, function() {
            me.handle.remove(); 
        });
        this.track.remove();
    }

    this.statedraw = function()
    {
        var html = "<p>Draw a box around one of these objects:</p>"; 

        html += "<ul>";
        for (var i in this.job.labels)
        {
            html += "<li>" + this.job.labels[i] + "</li>";
        }
        html += "</ul>";
        html += "<p>Do not annotate the same object twice.</p>";

        this.drawinst = $("<div>" + html + "</div>").appendTo(this.handle);
        this.drawinst.hide().slideDown();
    }

    this.stateclassify = function()
    {
        this.drawinst.slideUp(null, function() {
            me.drawinst.remove(); 
        });

        var html = "<p>What type of object did you just annotate?</p>";
        for (var i in job.labels)
        {
            var id = "classification" + this.id + "_" + i;
            html += "<div class='label'><input type='radio' name='classification" + this.id + "' id='" + id + "'> <label for='" + id + "'>" + job.labels[i] + "</label></div>";
        }

        this.classifyinst = $("<div>" + html + "</div>").appendTo(this.handle);
        this.classifyinst.hide().slideDown();

        $("input[name='classification" + this.id + "']").click(function() {
            me.classifyinst.slideUp(null, function() {
                me.classifyinst.remove(); 
            });

            for (var i in me.job.labels)
            {
                var id = "classification" + me.id + "_" + i;
                if ($("#" + id + ":checked").size() > 0)
                {
                    me.finalize(i);
                    me.statefolddown();
                    break;
                }
            }

        });
    }
    
    this.finalize = function(labelid)
    {
        this.label = labelid;
        this.track.label = labelid;

        this.headerdetails = $("<div style='float:right;'></div>").appendTo(this.handle);
        this.header = $("<p class='trackobjectheader'><strong>" + this.job.labels[this.label] + " " + (this.id + 1) + "</strong></p>").appendTo(this.handle).hide().slideDown();
        this.opencloseicon = $('<div class="ui-icon ui-icon-triangle-1-e"></div>').prependTo(this.header);
        this.details = $("<div class='trackobjectdetails'></div>").appendTo(this.handle).hide();

        this.setupdetails();

        this.header.mouseup(function() {
            me.click();
        });

        this.ready = true;
        this._callback(this.onready);
    }

    this.setupdetails = function()
    {
        this.details.append("<input type='checkbox' id='trackobject" + this.id + "lost'> <label for='trackobject" + this.id + "lost'>Outside of view frame</label><br>");
        this.details.append("<input type='checkbox' id='trackobject" + this.id + "occluded'> <label for='trackobject" + this.id + "occluded'>Occluded or obstructed</label><br>");

        for (var i in this.job.attributes[this.track.label])
        {
            this.details.append("<input type='checkbox' id='trackobject" + this.id + "attribute" + i + "'> <label for='trackobject" + this.id + "attribute" + i +"'>" + this.job.attributes[this.track.label][i] + "</label><br>");

            // create a closure on attributeid
            (function(attributeid) {

                $("#trackobject" + me.id + "attribute" + i).click(function() {
                    me.player.pause();

                    var checked = $(this).attr("checked");
                    me.track.setattribute(attributeid, checked);
                    me.track.notifyupdate();

                    if (checked) 
                    {
                        eventlog("markattribute", "Mark object as " + me.job.attributes[me.track.label][attributeid]);
                    }
                    else
                    {
                        eventlog("markattribute", "Mark object as not " + me.job.attributes[me.track.label][attributeid]);
                    }
                });

            })(i);
        }


        $("#trackobject" + this.id + "lost").click(function() {
            me.player.pause();

            var outside = $(this).attr("checked");
            me.track.setoutside(outside);
            me.track.notifyupdate();

            if (outside)
            {
                eventlog("markoutside", "Mark object outside");
            }
            else
            {
                eventlog("markoutside", "Mark object inside");
            }
        });
        $("#trackobject" + this.id + "occluded").click(function() {
            me.player.pause();

            var occlusion = $(this).attr("checked");
            me.track.setocclusion(occlusion);
            me.track.notifyupdate();

            if (occlusion)
            {
                eventlog("markocclusion", "Mark object as occluded");
            }
            else
            {
                eventlog("markocclusion", "Mark object as not occluded");
            }
        });

        this.player.onupdate.push(function() {
            me.updatecheckboxes();
        });

        //this.details.append("<br><input type='button' id='trackobject" + this.id + "label' value='Change Type'>");
        this.headerdetails.append("<div style='float:right;'><div class='ui-icon ui-icon-trash' id='trackobject" + this.id + "delete'></div></div>");

        $("#trackobject" + this.id + "delete").click(function() {
            if (window.confirm("Delete the " + me.job.labels[me.label] + " " + (me.id + 1) + " track? If the object just left the view screen, click the \"Outside of view frame\" check box instead."))
            {
                me.remove();
                eventlog("removeobject", "Deleted an object");
            }
        });
    }

    this.updatecheckboxes = function()
    {
        var e = this.track.journal.estimate(this.player.frame);
        $("#trackobject" + this.id + "lost").attr("checked", e.outside);
        $("#trackobject" + this.id + "occluded").attr("checked", e.occluded);

        for (var i in this.job.attributes[this.track.label])
        {
            if (e.attributes.indexOf(i) == -1)
            {
                $("#trackobject" + this.id + "attribute" + i).attr("checked", false);
            }
            else
            {
                $("#trackobject" + this.id + "attribute" + i).attr("checked", true);
            }
        }
    }

    this.disable = function()
    {
        if (this.ready)
        {
            $("#trackobject" + this.id + "lost").attr("disabled", true);
            $("#trackobject" + this.id + "occluded").attr("disabled", true);
        }
    }

    this.enable = function()
    {
        if (this.ready)
        {
            $("#trackobject" + this.id + "lost").attr("disabled", false);
            $("#trackobject" + this.id + "occluded").attr("disabled", false);
        }
    }

    this.statefoldup = function()
    {
        this.handle.addClass("trackobjectfoldedup");
        this.handle.removeClass("trackobjectfoldeddown");
        this.details.slideUp();
        this.headerdetails.fadeOut();
        this.foldedup = true;
        this._callback(this.onfoldup);

        this.opencloseicon.removeClass("ui-icon-triangle-1-s");
        this.opencloseicon.addClass("ui-icon-triangle-1-e");
    }

    this.statefolddown = function()
    {
        this.handle.removeClass("trackobjectfoldedup");
        this.handle.addClass("trackobjectfoldeddown");
        this.details.slideDown();
        this.headerdetails.fadeIn();
        this.foldedup = false;
        this._callback(this.onfolddown);

        this.opencloseicon.removeClass("ui-icon-triangle-1-e");
        this.opencloseicon.addClass("ui-icon-triangle-1-s");
    }

    this.mouseover = function()
    {
        this.highlight();

        if (this.track)
        {
            this.tracks.dim(true);
            this.track.dim(false);
            this.track.highlight(true);
        }

        if (this.opencloseicon)
        {
            this.opencloseicon.addClass("ui-icon-triangle-1-se");
        }
    }

    this.highlight = function()
    {
        this.handle.css({
            'border-color': me.color[0],
            'background-color': me.color[1],
        });
    }

    this.mouseout = function()
    {
        this.unhighlight();

        if (this.track)
        {
            this.tracks.dim(false);
            this.track.highlight(false);
        }

        if (this.opencloseicon)
        {
            this.opencloseicon.removeClass("ui-icon-triangle-1-se");
        }
    }

    this.unhighlight = function()
    {
        this.handle.css({
            'border-color': me.color[2],
            'background-color': me.color[2],
        });
    }

    this.click = function()
    {
        if (this.ready)
        {
            if (this.foldedup)
            {
                this.statefolddown();
            }
            else
            {
                this.statefoldup();
            }
        }
    }

    this._callback = function(list)
    {
        for (var i = 0; i < list.length; i++)
        {
            list[i](me);
        }
    }
}
