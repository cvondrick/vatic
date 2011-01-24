function ui_build(job)
{
    var screen = ui_setup(job);
    var videoframe = $("#videoframe");
    var player = new VideoPlayer(videoframe, job);
    var tracks = new TrackCollection(player, job);
    var drawer = new BoxDrawer(videoframe);

    ui_setupbuttons(player, tracks);
    ui_setupslider(player);
    ui_setupnewobjects(player, tracks, drawer)
    ui_setupsubmit(job, tracks);
}

function ui_setupnewobjects(player, tracks, drawer)
{
    var colors = null;
    var trackobject = null;

    $("#newobjectbutton").button({
        icons: {
            primary: "ui-icon-plusthick",
            disabled: false
        }
    }).click(function() {
        if (colors != null)
        {
            return;
        }

        player.pause();

        colors = ui_pickcolor();
        drawer.color = colors[0];
        drawer.enable();

        var mecolors = colors;

        $(this).button("option", "disabled", true);

        trackobject = $("<div class='trackobject'><div>");
        trackobject.prependTo($("#objectcontainer"));
        trackobject.css({
            'background-color': colors[1],
            'border-color': colors[0]});
        trackobject.html("Person");
        trackobject.mouseover(function() {
            $(this).css({
                'background-color': mecolors[0],
                'color': '#fff'
            })
        });
        trackobject.mouseout(function() {
            $(this).css({
                'background-color': mecolors[1],
                'color': '#000'
            });
        });

        tracks.resizable(false);
        tracks.draggable(false);
    });

    drawer.onstopdraw.push(function(position) {
        var track = tracks.add(player.frame, position, colors[0]);

        drawer.disable();
        colors = null;
        $("#newobjectbutton").button("option", "disabled", false);

        trackobject.hover(function() {
            tracks.dim(true);
            track.dim(false);
            track.highlight(true);
        }, function() {
            tracks.dim(false);
            track.highlight(false);
        });

        tracks.draggable(true);
        if ($("#annotateoptionsresize:checked").size() == 0)
        {
            tracks.resizable(true);
        }
        else
        {
            track.resizable(false);
        }
    });
}

function ui_setup(job)
{
    var screen = $("<div id='annotatescreen'></div>").appendTo(container);

    $("<table>" + 
        "<tr>" +
            "<td><div id='instructions'><div id='instructionsbutton' class='button'>Instructions</div> Annotate the entire video below. We will hand review your work.</td>" +
            "<td><div id='topbar'></div></td>" +
        "</tr>" +
        "<tr>" +
              "<td><div id='videoframe'></div></td>" + 
              "<td rowspan='2'><div id='sidebar'></div></td>" +
          "</tr>" + 
          "<tr>" +
              "<td><div id='bottombar'></div></td>" + 
          "</tr>" +
          "<tr>" +
              "<td><div id='advancedoptions'></div></td>" +
              "<td><div id='submitbar'></div></td>" +
          "</tr>" +
      "</table>").appendTo(screen).css("width", "100%");


    $("#videoframe").css({"width": job.width + "px",
                          "height": job.height + "px"})
                    .parent().css("width", job.width + "px");

    $("#sidebar").css("height", job.height + "px");


    $("#bottombar").append("<div id='playerslider'></div>");
    $("#bottombar").append("<div class='button' id='playbutton'>Play</div> ");
    $("#bottombar").append("<div class='button' id='rewindbutton'>Rewind</div>");

    $("#topbar").append("<div id='newobjectcontainer'>" +
        "<div class='button' id='newobjectbutton'>New Object</div></div>");

    $("<div id='objectcontainer'></div>").appendTo("#sidebar");

    $("<div class='button' id='openadvancedoptions'>Options</div>")
        .button({
            icons: {
                primary: "ui-icon-wrench"
            }
        }).appendTo($("#advancedoptions").parent()).click(function() {
                $(this).remove();
                $("#advancedoptions").show();
            });

    $("#advancedoptions").hide();

    $("#advancedoptions").append(
    "<input type='checkbox' id='annotateoptionsresize'>" +
    "<label for='annotateoptionsresize'>Disable Resize?</label> " +
    "<input type='checkbox' id='annotateoptionshideboxes'>" +
    "<label for='annotateoptionshideboxes'>Hide Boxes?</label> ");

    $("#advancedoptions").append(
    "<div id='speedcontrol'>" +
    "<input type='radio' name='speedcontrol' " +
        "value='15,1' id='speedcontrolslow'>" +
    "<label for='speedcontrolslow'>Slow</label>" +
    "<input type='radio' name='speedcontrol' " +
        "value='30,1' id='speedcontrolnorm' checked='checked'>" +
    "<label for='speedcontrolnorm'>Normal</label>" +
    "<input type='radio' name='speedcontrol' " +
        "value='30,3' id='speedcontrolfast'>" +
    "<label for='speedcontrolfast'>Fast</label>" +
    "</div>");

    $("#submitbar").append("<div id='submitbutton' class='button'>Submit HIT</div>");

    return screen;
}

function ui_setupbuttons(player, tracks)
{
    $("#instructionsbutton").click(function() {
        player.pause();
        ui_showinstructions(); 
    }).button({
        icons: {
            primary: "ui-icon-newwin"
        }
    });

    $("#playbutton").click(function() {
        player.toggle();
    }).button({
        icons: {
            primary: "ui-icon-play"
        }
    });

    $("#rewindbutton").click(function() {
        player.pause();
        player.seek(player.job.start);
    }).button({
        text: false,
        disabled: true,
        icons: {
            primary: "ui-icon-seek-first"
        }
    });

    player.onplay.push(function() {
        $("#playbutton").button("option", {
            label: "Pause",
            icons: {
                primary: "ui-icon-pause"
            }
        });
    });

    player.onpause.push(function() {
        $("#playbutton").button("option", {
            label: "Play",
            icons: {
                primary: "ui-icon-play"
            }
        });
    });

    player.onupdate.push(function() {
        if (player.frame == player.job.stop)
        {
            $("#playbutton").button("option", "disabled", true);
        }
        else if ($("#playbutton").button("option", "disabled"))
        {
            $("#playbutton").button("option", "disabled", false);
        }

        if (player.frame == player.job.start)
        {
            $("#rewindbutton").button("option", "disabled", true);
        }
        else if ($("#rewindbutton").button("option", "disabled"))
        {
            $("#rewindbutton").button("option", "disabled", false);
        }
    });

    $("#speedcontrol").buttonset();
    $("input[name='speedcontrol']").click(function() {
        player.fps = parseInt($(this).val().split(",")[0]);
        player.playdelta = parseInt($(this).val().split(",")[1]);
        console.log("Change FPS to " + player.fps);
        console.log("Change play delta to " + player.playdelta);
        if (!player.paused)
        {
            player.pause();
            player.play();
        }
    });

    $("#annotateoptionsresize").button().click(function() {
        tracks.resizable(!$(this).attr("checked"));
    });

    $("#annotateoptionshideboxes").button().click(function() {
        tracks.visible($(this).attr("checked"));
    });

    $(window).keypress(function(e) {
        if (e.keyCode == 32)
        {
            $("#playbutton").click();
        }
        if (e.keyCode == 114)
        {
            $("#rewindbutton").click();
        }
        else if (e.keyCode == 110)
        {
            $("#newobjectbutton").click();
        }
        else if (e.keyCode == 60 || e.keyCode == 44)
        {
            player.pause();
            player.displace(-10);
        }
        else if (e.keyCode == 62 || e.keyCode == 46)
        {
            player.pause();
            player.displace(10);
        }
        console.log("Key press: " + e.keyCode);
    });

}

function ui_setupslider(player)
{
    var slider = $("#playerslider");
    slider.slider({
        range: "min",
        value: player.job.start,
        min: player.job.start,
        max: player.job.stop,
        slide: function(event, ui) {
            player.pause();
            player.seek(ui.value);
        }
    });

    slider.css({
        marginTop: "6px",
        width: "590px",
        float: "right"
    });

    player.onupdate.push(function() {
        slider.slider({value: player.frame});
    });
}

function ui_setupsubmit(job, tracks)
{
    $("#submitbutton").button({
        icons: {
            primary: 'ui-icon-check'
        }
    }).click(function() {
        ui_submit(job, tracks);
    });
}

function ui_submit(job, tracks)
{
    console.log("Start submit - status: " + tracks.serialize());

    if (!mturk_isassigned())
    {
        alert("Please accept the task before you submit.");
        return;
    }

    $('<div id="turkic_overlay"></div>').appendTo("#container");

    var note = $("<div id='submitdialog'>Saving...</div>").appendTo("#container")
    note.effect("pulsate");

    mturk_submit(function(redirect) {
        server_post("savejob", [job.jobid], tracks.serialize(), function(data) {
            note.html("Saved!");
            redirect();
        });
    });
}

function ui_showinstructions()
{
    console.log("Popup instructions");

    $('<div id="turkic_overlay"></div>').appendTo("#container");
    var h = $('<div id="instructionsdialog"></div>').appendTo("#container");

    $('<div class="button" id="instructionsclosetop">Dismiss Instructions</div>').appendTo(h).button({
        icons: {
            primary: "ui-icon-circle-close"
        }
    }).click(ui_closeinstructions);

    h.append("<h1>Important Instructions</h1>");
    h.append("<p>In this task, you are going to annotate a video. You are to draw a box around every object of interest and track each object for the entirity of the video.</p>");

    h.append("<h2>Keyboard Shortcuts</h2>");
    h.append('<ul style="list-style-type:none;margin-left:0;padding-left:0;">' +
        '<li><code>n</code> creates a new object</li>' +
        '<li><code>[space]</code> toggles play/pause on the video</li>' +
        '<li><code>r</code> rewinds the video to the start</li>' +
        '</ul>');
}

function ui_closeinstructions()
{
    console.log("Popdown instructions");
    $("#turkic_overlay").remove();
    $("#instructionsdialog").remove();
}

/*
 * The colors we will cycle through when displaying tracks.
 */
var ui_colors = [["#FF00FF", "#FFBFFF"],
                 ["#FF0000", "#FFBFBF"],
                 ["#FF8000", "#FFDCBF"],
                 ["#FFD100", "#FFEEA2"],
                 ["#008000", "#8FBF8F"],
                 ["#0080FF", "#BFDFFF"],
                 ["#0000FF", "#BFBFFF"],
                 ["#000080", "#8F8FBF"],
                 ["#800080", "#BF8FBF"]];

function ui_pickcolor()
{
    // move first element to end, then get last
    return ui_colors[ui_colors.push(ui_colors.shift()) - 1];
}

