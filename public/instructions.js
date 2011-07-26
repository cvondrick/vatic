function instructions(job, h)
{
    h.append("<h1>Important Instructions</h1>");
    h.append("<p>In this task, we ask you to annotate a video. You are to draw a box around every object of interest and track each object for the entire video. These instructions will give you tips on how to best use our tool.</p>");

    h.append("<h2>Crash Course</h2>");
    var str = "<ul>";
    str += "<li>Annotate <strong>every object</strong> of interest.</li>";
    str += "<li>Annotate stationary objects, obstructed objects, and moving objects.</li>";
    str += "<li>Make your boxes as tight as possible.</li>";
    if (job.perobject > 0)
    {
        var amount = Math.floor(job.perobject * 100);
        str += "<li>We will pay you <strong>" + amount + "&cent; for each object</strong> you annotate.</li>";
    }
    if (job.completion > 0)
    {
        var amount = Math.floor(job.completion * 100);
        str += "<li>We will award you a <strong>bonus of " + amount + "&cent; if you annotate every object</strong>.</li>";
    }
    if (job.skip > 0)
    {
        str += "<li>When the video pauses, adjust your annotations.</li>";
    }
    str += "<li>We will hand review your work.</li>";
    str += "</ul>";
    h.append(str);

    h.append("<h2>Getting Started</h2>");
    h.append("<img src='box.jpg' align='right'>");
    h.append("<p>Click the <strong>New Object</strong> button to start annotating your first object. Position your cursor over the view screen to click on the corner of an object of interest. Use the cross hairs to line up your click. Click on another corner to finish drawing the box. The rectangle should tightly and completely enclose the object you are annotating. Resize the box, if necessary, by dragging the edges of the box.</p>");

    h.append("<img src='classify.jpg' align='right'>");
    h.append("<p>On the right, directly below the New Object button, you will find a colorful box. The box is prompting you to input which type of object you have labeled. Click the correst response.</p>");

    if (job.skip > 0)
    {
        h.append("<p>Press the <strong>Play</strong> button. The video will play. When the video automatically pauses, adjust the boxes. Using your mouse, drag-and-drop the box to the correct position and resize if necessary. Continue in this fashion until you have reached the end of the video.</p>");
    }
    else
    {
        h.append("<p>Press the <strong>Play</strong> button. The video will begin to play forward. After the object you are tracking has moved a bit, click <strong>Pause</strong>. Using your mouse, drag-and-drop the box to the correct position and resize if necessary. Continue in this fashion until you have reached the end of the video.</p>");
    }

    if (job.perobject > 0)
    {
        h.append("<p>Once you have reached the end, you should rewind by pressing the rewind button (next to Play) and repeat this process for every object of interest. You are welcome to annotate multiple objects each playthrough. We will pay you a bonus for every object that you annotate.</p>");
    }
    else
    {
        h.append("<p>Once you have reached the end, you should rewind by pressing the rewind button (next to Play) and repeat this process for every object of interest. You are welcome to annotate multiple objects each playthrough.</p>");
    }

    h.append("<img src='outsideoccluded.jpg' align='right'>");
    h.append("<p>If an object leaves the screen, mark the <strong>Outside of view frame</strong> checkbox for the corresponding sidebar rectangle. Make sure you click the right button. When you mouse over the controls, the corresponding rectangle will light up in the view screen. Likewise, if the object you are tracking is still in the view frame but the view is obstructed (e.g., inside a car), mark the <strong>Occluded or obstructed</strong> checkbox. When the object becomes visible again, remember to uncheck these boxes. If there are additional checkboxes describing attributes, mark those boxes for the duration that it applies. For example, only mark \"Walking\" when the person is walking.</p>");

    h.append("<p>If there are many objects on the screen, it can become difficult to select the right bounding box. By pressing the lock button <img src='lock.jpg'> on an object's sidebar rectangle, you can prevent changes to that track. Press the lock button again to renable modifications.</p>");

    h.append("<p>Remembering which box correspond to which box can be confusing. If you click on a box in the view screen, a tooltip will pop that will attempt to remind you of the box's identity.</p>");
    
    h.append("<p>When you are ready to submit your work, rewind the video and watch it through one more time. Does each rectangle follow the object it is tracking for the entire sequence? If you find a spot where it misses, press <strong>Pause</strong> and adjust the box. After you have checked your work, press the <strong>Submit HIT</strong> button. We will pay you as soon as possible.</p>");

    h.append("<h2>How We Accept Your Work</h2>");
    h.append("<p>We will hand review your work and we will only accept high quality work. Your annotations are not compared against other workers. Follow these guidelines to ensure your work is accepted:</p>");

    h.append("<h3>Label Every Object</h3>")
    h.append('<iframe title="YouTube video player" width="560" height="349" src="http://www.youtube.com/embed/H8cMZkz8Kbw?rel=0" frameborder="0" allowfullscreen></iframe>');
    //h.append("<img src='secret.png'>");
    //h.append("<img src='everyobject.jpg'>");

    if (job.perobject > 0)
    {
        h.append("<p>Every object of interest should be labeled for the entire video. The above work was accepted because every object has a box around it. An object is not labeled more than once. Even if the object does not move, you must label it. We will pay you a bonus for every object you annotate.</p>");
    }
    else
    {
        h.append("<p>Every object of interest should be labeled for the entire video. The above work was accepted because every object has a box around it. An object is not labeled more than once. Even if the object does not move, you must label it.</p>");
    }

    h.append("<h3>Boxes Are Tight</h3>");
    h.append("<table><tr><td><img src='tight-good.jpg'></td><td><img src='tight-bad.jpg'></td></tr><tr><th>Good</th><th>Bad</th></tr></table>");
    h.append("<p>The boxes you draw must be tight. They boxes must fit around the object as close as possible. The loose annotation on the right would be rejected while the tight annotation on the left will be accepted.</p>");

    h.append("<h3>Entire Video is Labeled</h3>")
    h.append("<img src='sequence1.jpg'> ");
    h.append("<img src='sequence3.jpg'> ");
    h.append("<img src='sequence4.jpg'><br>");
    h.append("<p>The entire video sequence must be labeled. When an object moves, you must update its position. A box must describe only one object. You should never change which object identity a particular box tracks.</p>");

    h.append("<h3>Disappearing and Reappearing Objects</h3>");
    h.append("<p>In order for your work to be accepted, you must correctly label objects as they enter and leave the scene. We want you to annotate the moment each object enters and leaves the scene. As it is often difficult to pinpoint the exact moment an object enters or leaves the scene, we allow some mistakes here, but only slightly!</p>");

    h.append("<img src='entering1.png'> <img src='entering2.png'> <img src='entering3.png'> <img src='entering4.png'><br>");

    h.append("<p>If one object enters another object (such as a person getting inside a car), you should mark the disappearing object as outside of the view frame. Likewise, you should start annotating an object the moment it steps out of the enclosing object.</p>");

    h.append("<img src='outofcar1.png'> <img src='outofcar2.png'> <img src='outofcar3.png'> <br>");

    h.append("<p>If an object disappears from the scene and the exact same object reappears later in the scene, you must mark that object as back inside the view frame. Do <em>not</em> draw a new object for its second appearance. Simply find the corresponding right-column rectangle and uncheck the <strong>Outside of view frame</strong> checkbox and position the box.</p>");

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
        '<li><code>t</code> toggles play/pause on the video</li>' +
        '<li><code>r</code> rewinds the video to the start</li>' +
        '<li><code>h</code> hides/shows the boxes (only after clicking Options button)</li>' +
        '<li><code>d</code> jump the video forward a bit</li>' +
        '<li><code>f</code> jump the video backward a bit</li>' +
        '<li><code>v</code> step the video forward a tiny bit</li>' +
        '<li><code>c</code> step the video backward a tiny bit</li>' +
        '</ul>');
}
