function Job(data)
{
    var me = this;

    this.slug = data["slug"];
    this.start = data["start"];
    this.stop = data["stop"];
    this.width = data["width"];
    this.height = data["height"];

    this.frameurl = function(i)
    {
        folder1 = parseInt(Math.floor(i / 100));
        folder2 = parseInt(Math.floor(i / 10000));
        return me.slug + 
            "/" + folder2 + "/" + folder1 + "/" + parseInt(i) + ".jpg";
    }
}
