signature = "Qdy65mPoD7yUuDlfSwyBY6XCDPaEPg4hfMSpM8rt"
accesskey = "AKIAIOZDXRMCRUIHDQSQ"
sandbox   = True
localhost = "http://localhost/"
database  = "mysql://root@localhost/turkic"

# probably no need to mess below this line

import multiprocessing
processes = multiprocessing.cpu_count()

import os.path
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
