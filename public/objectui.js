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

    this.newobjectbuttonenabled = true;
    this.counter = 0;

    this.currentobject = null;
    this.currentcolor = null;

    this.startnewobject = function()
    {
        if (!this.newobjectbuttonenabled)
        {
            return;
        }

        console.log("Starting new track object");

        this.player.pause();

        this.currentcolor = this.pickcolor();
        this.drawer.color = this.currentcolor[0];
        this.drawer.enable();

        this.button.button("option", "disabled", true);
        this.newobjectbuttonenabled = false;

        this.currentobject = new TrackObject(this.job, container, this.currentcolor);
        this.currentobject.statedraw();

        this.tracks.resizable(false);
        this.tracks.draggable(false);
    }

    this.stopdrawing = function(position)
    {
        console.log("Received new track object drawing");

        var track = tracks.add(player.frame, position, this.currentcolor[0]);

        this.drawer.disable();
        
        this.currentobject.initialize(this.counter++, track, this.tracks);
        this.currentobject.stateclassify();

        this.currentobject.onready.push(function() {
            me.stopnewobject();
        });
    }

    this.stopnewobject = function()
    {
        console.log("Finished new track object");

        this.tracks.draggable(true);
        if ($("#annotateoptionsresize:checked").size() == 0)
        {
            this.tracks.resizable(true);
        }
        else
        {
            this.track.resizable(false);
        }

        this.tracks.dim(false);
        this.currentobject.track.highlight(false);

        this.button.button("option", "disabled", false);
        this.newobjectbuttonenabled = true;
    }

    this.setup = function()
    {
        this.button.button({
            icons: {
                primary: "ui-icon-plusthick",
                disabled: false
            }
        }).click(function() {
            me.startnewobject();
        });

        this.drawer.onstopdraw.push(function(position) {
            me.stopdrawing(position);
        });
    }

    this.setup();

    this.availcolors = [["#FF00FF", "#FFBFFF"],
                        ["#FF0000", "#FFBFBF"],
                        ["#FF8000", "#FFDCBF"],
                        ["#FFD100", "#FFEEA2"],
                        ["#008000", "#8FBF8F"],
                        ["#0080FF", "#BFDFFF"],
                        ["#0000FF", "#BFBFFF"],
                        ["#000080", "#8F8FBF"],
                        ["#800080", "#BF8FBF"]];
    this.pickcolor = function()
    {
        return this.availcolors[this.availcolors.push(this.availcolors.shift()) - 1];
    }
}

function TrackObject(job, container, color)
{
    var me = this;

    this.job = job;
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
        'background-color': color[1],
        'border-color': color[0]});
    this.handle.mouseover(function() {
        me.mouseover();
    });
    this.handle.mouseout(function() {
        me.mouseout();
    });
    this.handle.mouseup(function() {
        me.click();
    });
    this.header = null;
    this.details = null;

    this.ready = false;
    this.foldedup = false;

    this.initialize = function(id, track, tracks)
    {
        this.id = id;
        this.track = track;
        this.tracks = tracks;
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

        html += "<p>Do not label an object more than once.</p>";

        this.handle.html(html);
    }

    this.stateclassify = function()
    {
        var html = "<p>What type of object did you just annotate?</p>";
        for (var i in job.labels)
        {
            var id = "classification" + this.id + "_" + i;
            html += "<input type='radio' name='classification" + this.id + "' id='" + id + "'> <label for='" + id + "'>" + job.labels[i] + "</label><br>";
        }
        html += "<input type='button' value='Done' id='object" + this.id + "done'>";

        this.handle.html(html);

        $("#object" + this.id + "done").click(function() {
            me.finalize();
        });
    }
    
    this.finalize = function()
    {
        for (var i in this.job.labels)
        {
            var id = "classification" + this.id + "_" + i;
            if ($("#" + id + ":checked").size() > 0)
            {
                this.label = i;
                break;
            }
        }

        this.handle.html("");
        this.header = $("<p class='trackobjectheader'><strong>" + this.job.labels[this.label] + " " + (this.id + 1) + "</strong></p>").appendTo(this.handle);
        this.details = $("<div class='trackobjectdetails'></div>").appendTo(this.handle).hide();

        this.statefoldup();
        this.ready = true;
        this._callback(this.onready);
    }

    this.statefoldup = function()
    {
        this.handle.addClass("trackobjectfoldedup");
        this.handle.removeClass("trackobjectfoldeddown");
        this.details.slideUp();
        this.foldedup = true;
        this._callback(this.onfoldup);
    }

    this.statefolddown = function()
    {
        this.handle.removeClass("trackobjectfoldedup");
        this.handle.addClass("trackobjectfoldeddown");
        this.details.slideDown();
        this.foldedup = false;
        this._callback(this.onfolddown);
    }

    this.mouseover = function()
    {
        if (this.ready)
        {
            this.header.css({
                'background-color': me.color[0],
                'color': '#fff'
            })

            this.tracks.dim(true);
            this.track.dim(false);
            this.track.highlight(true);
        }
    }

    this.mouseout = function()
    {
        if (this.ready)
        {
            this.header.css({
                'background-color': me.color[1],
                'color': '#000'
            });

            this.tracks.dim(false);
            this.track.highlight(false);
        }
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
