function Job(data)
{
    var me = this;

    this.slug = data["slug"];
    this.start = parseInt(data["start"]);
    this.stop = parseInt(data["stop"]);
    this.width = parseInt(data["width"]);
    this.height = parseInt(data["height"]);
    this.skip = parseInt(data["skip"]);
    this.jobid = parseInt(data["jobid"]);
    this.labels = data["labels"];

    console.log("Job configured!");
    console.log("  Slug: " + this.slug);
    console.log("  Start: " + this.start);
    console.log("  Stop: " + this.stop);
    console.log("  Width: " + this.width);
    console.log("  Height: " + this.height);
    console.log("  Skip: " + this.skip);
    console.log("  Job ID: " + this.jobid);
    console.log("  Labels: ");
    for (var i in this.labels)
    {
        console.log("    " + i + " = " + this.labels[i]);
    }

    this.frameurl = function(i)
    {
        folder1 = parseInt(Math.floor(i / 100));
        folder2 = parseInt(Math.floor(i / 10000));
        return "frames/" + me.slug + 
            "/" + folder2 + "/" + folder1 + "/" + parseInt(i) + ".jpg";
    }
}
