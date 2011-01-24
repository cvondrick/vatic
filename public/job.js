function Job(data)
{
    var me = this;

    this.slug = data["slug"];
    this.start = parseInt(data["start"]);
    this.stop = parseInt(data["stop"]);
    this.width = parseInt(data["width"]);
    this.height = parseInt(data["height"]);
    this.jobid = parseInt(data["jobid"]);

    this.frameurl = function(i)
    {
        folder1 = parseInt(Math.floor(i / 100));
        folder2 = parseInt(Math.floor(i / 10000));
        return "frames/" + me.slug + 
            "/" + folder2 + "/" + folder1 + "/" + parseInt(i) + ".jpg";
    }
}
