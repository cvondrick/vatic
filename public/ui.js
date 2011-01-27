var ui_disabled = 0;

function ui_build(job)
{
    var screen = ui_setup(job);
    var videoframe = $("#videoframe");
    var player = new VideoPlayer(videoframe, job);
    var tracks = new TrackCollection(player, job);

    ui_setupbuttons(player, tracks);
    ui_setupslider(player);
    ui_setupsubmit(job, tracks);

    var objectui = new TrackObjectUI($("#newobjectbutton"), $("#objectcontainer"), videoframe, job, player, tracks);
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
        if (ui_disabled) return;
        player.toggle();
    }).button({
        icons: {
            primary: "ui-icon-play"
        }
    });

    $("#rewindbutton").click(function() {
        if (ui_disabled) return;
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
        console.log("Key press: " + e.keyCode);

        if (ui_disabled)
        {
            console.log("Key press ignored because UI is disabled.");
            return;
        }
        
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
        else if (e.keyCode == 44)
        {
            player.pause();
            player.displace(-10);
        }
        else if (e.keyCode == 46)
        {
            player.pause();
            player.displace(10);
        }
        else if (e.keyCode == 62)
        {
            player.pause();
            player.displace(1);
        }
        else if (e.keyCode == 60)
        {
            player.pause();
            player.displace(-1);
        }
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

    /*slider.children(".ui-slider-handle").hide();
    slider.children(".ui-slider-range").css({
        "background-color": "#868686",
        "background-image": "none"});*/

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
        if (ui_disabled) return;
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

    ui_disable();

    $('<div id="turkic_overlay"></div>').appendTo("#container");

    var note = $("<div id='submitdialog'>Saving...</div>").appendTo("#container")

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

    if ($("#instructionsdialog").size() > 0)
    {
        return;
    }

    $('<div id="turkic_overlay"></div>').appendTo("#container");
    var h = $('<div id="instructionsdialog"></div>').appendTo("#container");

    $('<div class="button" id="instructionsclosetop">Dismiss Instructions</div>').appendTo(h).button({
        icons: {
            primary: "ui-icon-circle-close"
        }
    }).click(ui_closeinstructions);

    h.append("<h1>Important Instructions</h1>");
    h.append("<p>In this task, we ask you to annotate a video. You are to draw a box around every object of interest and track each object for the entire video. These instructions will give you tips on how to best use our tool.</p>");

    h.append("<h2>Getting Started</h2>");
    h.append("<img src='box.jpg' align='right'>");
    h.append("<p>Click the <strong>New Object</strong> button to start annotating your first object. Position your cursor over the view screen to click on the corner of an object of interest. Use the cross hairs to line up your click. Click on another corner to finish drawing the box. The rectangle should tightly and completely enclose the object you are annotating. Resize the box, if necessary, by dragging the edges of the box.</p>");

    h.append("<img src='classify.jpg' align='right'>");
    h.append("<p>On the right, directly below the New Object button, you will find a colorful box. The box is prompting you to input which type of object you have labeled. Click the correst response.</p>");

    h.append("<p>Press the <strong>Play</strong> button. The video will begin to play forward. After the object you are tracking has moved a bit, click <strong>Pause</strong>. Using your mouse, drag-and-drop the box to the correct position and resize if necessary. Continue in this fashion until you have reached the end of the video.</p>");

    h.append("<p>Once you have reached the end, you should rewind by pressing the rewind button (next to Play) and repeat this process for every object of interest. You are welcome to annotate multiple objects each playthrough.</p>");

    h.append("<img src='outsideoccluded.jpg' align='right'>");
    h.append("<p>If an object leaves the screen, mark the <strong>Outside of view frame</strong> checkbox for the corresponding tracking rectangle. Make sure you click the right button. When you mouse over the controls, the corresponding rectangle will light up in the view screen. Likewise, if the object you are tracking is still in the view frame but the view is obstructed (e.g., inside a car), mark the <strong>Occluded or obstructed</strong> checkbox. When the object becomes visible again, remember to uncheck these boxes.</p>");

    h.append("<p>When you are ready to submit your work, rewind the video and watch it through one more time. Does each rectangle follow the object it is tracking for the entire sequence? If you find a spot where it misses, press <strong>Pause</strong> and adjust the box. After you have checked your work, press the <strong>Submit HIT</strong> button. We will pay you as soon as possible.</p>");

    h.append("<h2>How We Accept Your Work</h2>");
    h.append("<p>We will hand review your work and we will only accept high quality work. Your annotations are not compared against other workers. Follow these guidelines to ensure your work is accepted:</p>");

    h.append("<h3>Label Every Object</h3>")
    h.append("<img src='everyobject.jpg'>");
    h.append("<p>Every object of interest should be labeled for the entire video. The above work was accepted because every object has a box around it. An object is not labeled more than once.</p>");

    h.append("<h3>Boxes Are Tight</h3>");
    h.append("<table><tr><td><img src='tight-good.jpg'></td><td><img src='tight-bad.jpg'></td></tr><tr><th>Good</th><th>Bad</th></tr></table>");
    h.append("<p>The boxes you draw must be tight. They boxes must fit around the object as close as possible. The loose annotation on the right would be rejected while the tight annotation on the left will be accepted.</p>");

    h.append("<h3>Entire Video is Labeled</h3>")
    h.append("<img src='sequence1.jpg'> ");
    h.append("<img src='sequence3.jpg'> ");
    h.append("<img src='sequence4.jpg'><br>");
    h.append("<p>The entire video sequence must be labeled. When an object moves, you must update its position. A box must describe only one object. You should never change which object identity a particular box tracks.</p>");

    h.append("<h2>Advanced Features</h2>");
    h.append("<p>We have provided some advanced tools for videos that are especially difficult. Clicking the <strong>Options</strong> button will enable the advanced options.</p>");
    h.append("<ul>" +
        "<li>Clicking <strong>Disable Resize?</strong> will toggle between allowing you to resize the boxes. This option is helpful when the boxes become especially tiny.</li>" +
        "<li>Clicking <strong>Hide Boxes?</strong> will temporarily hide the boxes on the screen. This is useful when the scene becomes too crowded. Remember to click it again to show the boxes again!</li>" +
        "<li>The <strong>Slow</strong>, <strong>Normal</strong>, <strong>Fast</strong> buttons will change how fast the video plays back. If the video becomes confusing, slowing the play back speed may help.</li>" +
    "</ul>");

    h.append("<h3>Keyboard Shortcuts</h3>");
    h.append("<p>These keyboard shortcuts are available for your convenience:</p>");
    h.append('<ul class="keyboardshortcuts">' +
        '<li><code>n</code> creates a new object</li>' +
        '<li><code>[space]</code> toggles play/pause on the video</li>' +
        '<li><code>r</code> rewinds the video to the start</li>' +
        '<li><code>.</code> jump the video forward a bit</li>' +
        '<li><code>,</code> jump the video backward a bit</li>' +
        '<li><code>&gt;</code> step the video forward a tiny bit</li>' +
        '<li><code>&lt;</code> step the video backward a tiny bit</li>' +
        '</ul>');

    ui_disable();
}

function ui_closeinstructions()
{
    console.log("Popdown instructions");
    $("#turkic_overlay").remove();
    $("#instructionsdialog").remove();

    ui_enable();
}

function ui_disable()
{
    if (ui_disabled++ == 0)
    {
        $("#newobjectbutton").button("option", "disabled", true);
        $("#playbutton").button("option", "disabled", true);
        $("#rewindbutton").button("option", "disabled", true);
        $("#submitbutton").button("option", "disabled", true);
        $("#playerslider").slider("option", "disabled", true);

        console.log("Disengaged UI");
    }

    console.log("UI disabled with count = " + ui_disabled);
}

function ui_enable()
{
    if (--ui_disabled == 0)
    {
        $("#newobjectbutton").button("option", "disabled", false);
        $("#playbutton").button("option", "disabled", false);
        $("#rewindbutton").button("option", "disabled", false);
        $("#submitbutton").button("option", "disabled", false);
        $("#playerslider").slider("option", "disabled", false);

        console.log("Engaged UI");
    }

    ui_disabled = Math.max(0, ui_disabled);

    console.log("UI disabled with count = " + ui_disabled);
}
