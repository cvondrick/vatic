var development = false;

var container;

$(document).ready(function() {
    mturk_ready(function() {
        mturk_blockbadworkers(boot);
    });
});

function boot()
{
    console.log("Booting...");

    container = $("#container");

    if ($.browser.msie)
    {
        container.html("<p style='width:500px;'><strong>Sorry!</strong> This application does not currently support Internet Explorer. Please upgrade to a more modern browser to complete this HIT. We recommend <a href='http://www.google.com/chrome' target='_blank'>Google Chrome</a> or <a href='http://www.getfirefox.com' target='_blank'>Mozilla Firefox</a>.</p>");
        return;
    }

    if (!mturk_isassigned())
    {
        mturk_acceptfirst();
    }
    else
    {
        mturk_showstatistics();
    }

    var parameters = mturk_parameters();
    if (!parameters["id"])
    {
        death("Missing Job Id");
        return;
    }

    function dispatch(training)
    {
        training = training ? 1 : 0;
        server_request("getjob", [parameters["id"], training], function(data) {
            loadingscreen(job_import(data));
        });
    }

    worker_isverified(function() {
        console.log("Worker is verified");
        dispatch(false);
    }, function() {
        console.log("Worker is NOT verified");
        dispatch(true);
    });
}

function loadingscreen(job)
{
    var ls = $("<div id='loadingscreen'></div>");
    ls.append("<div id='loadingscreeninstructions' class='button'>Show " +
        "Instructions</div>");
    ls.append("<div id='loadingscreentext'>Downloading the video...</div>");
    ls.append("<div id='loadingscreenslider'></div>");

    if (!mturk_isassigned())
    {
        ls.append("<div class='loadingscreentip'><strong>Tip:</strong> You " +
            "are strongly recommended to accept the task before the " +
            "download completes. When you accept, you will have to restart " +
            "the download.</div>");
    }

    ls.append("<div class='loadingscreentip'>You are welcome to work on " +
        "other HITs while you wait for the download to complete. When the " +
        "download finishes, we'll play a gentle musical tune to notify " + 
        "you.</div>");

    container.html(ls);

    if (!development && !mturk_isoffline())
    {
        ui_showinstructions(job);
    }

    $("#loadingscreeninstructions").button({
        icons: {
            primary: "ui-icon-newwin"
        }
    }).click(function() {
        ui_showinstructions(job);
    });

    eventlog("preload", "Start preloading");

    preloadvideo(job.start, job.stop, job.frameurl,
        preloadslider($("#loadingscreenslider"), function(progress) {
            if (progress == 1)
            {
                if (!development && !mturk_isoffline())
                {
                    $("body").append('<div id="music"><embed src="magic.mp3">' +
                        '<noembed><bgsound src="magic.mp3"></noembed></div>');
                }

                ls.remove()
                ui_build(job);

                eventlog("preload", "Done preloading");
            }
        })
    );
}
