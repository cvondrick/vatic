import config
from turkic.cli import handler
import turkic.database
import models

@handler("Add videos to be labeled.", "import")
def importstuff(args):
    pass

@handler("Output all job data.")
def dump(args):
    pass

@handler("Reinstalls the database.")
def dbinit(args):
    turkic.database.reinstall() 
