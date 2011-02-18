"""
Quality assurance routines that take a list of candidate paths and compare
with a list of ground truth tracks.

>>> validate(candidates, truth, tolerable(0.5))
True
"""

import munkres
import logging

logger = logging.getLogger("vatic.qa")

class tolerable(object):
    """
    Tests if two paths agree by tolerable guidelines.
    """
    def __init__(self, overlap = 0.5, tolerance = 0.1, mistakes = 0):
        self.overlap = overlap
        self.tolerance = tolerance
        self.mistakes = mistakes

    def __call__(self, first, second):
        """
        Compares 'first' with 'second' to see if they agree.
        """
        firstboxes  = first.getboxes(interpolate = True)
        secondboxes = second.getboxes(interpolate = True)

        horrible = max(len(firstboxes), len(secondboxes)) + 1
        if first.label != second.label:
            return horrible
        if len(firstboxes) != len(secondboxes):
            return horrible

        return self.overlapcost(firstboxes, secondboxes)

    def overlapcost(self, first, second):
        """
        Computes the overlap cost between first and second. Both will be
        linearly filled.
        """
        cost = 0
        for f, s in zip(first, second):
            if f.lost != s.lost:
                cost += 1
            elif f.percentoverlap(s) < self.overlap:
                cost += 1
        return max(0, cost - float(len(first)) * self.tolerance)

    def validate(self, matches):
        """
        Validates whether the matches are sufficient and exact enough.
        """
        return sum(x[2] != 0 for x in matches) <= self.mistakes

    def __hash__(self):
        """
        Computes a hash for this type. Breaks duck typing because we hash on
        the type of the object as well.
        """
        return hash((type(self), self.overlap, self.tolerance, self.mistakes))

    def __eq__(self, other):
        """
        Checks equality between objects. Breaks duck typing because the types
        must now match.
        """
        try:
            return (self.overlap == other.overlap and
                    self.tolerance == other.tolerance and 
                    self.mistakes == other.mistakes and
                    type(self) is type(other))
        except AttributeError:
            return False

    def __ne__(self, other):
        """
        Checks inequality between classes. See __eq__().
        """
        return not (self == other)

    def __str__(self):
        return repr(self)

    def __repr__(self):
        return "tolerable({0}, {1}, {2})".format(self.overlap,
                                                 self.tolerance,
                                                 self.mistakes)

def validate(first, second, method = tolerable(0.5)):
    """
    Uses 'method' to validate the assignment to make sure it's adequate. 

    If 'method' does not have a 'validate' method, assume 0 cost is required.
    """
    try:
        method.validate
    except:
        return all(x[2] == 0 for x in match(first, second, method))
    else:
        return method.validate(match(first, second, method))

def match(first, second, method = tolerable(0.5)):
    """
    Attempts to match every path in 'first' with a path in 'second'. Returns 
    the association along with its score. 

    Note: if two paths have nothing to do with each other, but there is no
    other suitable candidate, the two seeminly unrelated paths will be
    associated. It is up to the caller to handle this situation. The 'validate'
    method may provide some help. Further, if len(first) != len(second), then
    some elements will be associated with None.
    """
    costs = buildmatrix(first, second, method)
    response = []

    for f, s in munkres.Munkres().compute(costs):
        response.append((first[f]  if f < len(first)  else None,
                         second[s] if s < len(second) else None,
                         costs[f][s]))
    return response

def buildmatrix(first, second, method):
    """
    Builds the matrix for the Hungarian algorithm. Pads with the worst to make
    the matrix square.
    """
    costs = [[method(f,s) for s in second] for f in first]

    if len(first) and len(second):
        horrible = [max(max(costs)) + 1]
    else:
        horrible = [1e10]

    if len(first) > len(second):
        for row in costs:
            row.extend(horrible * (len(first) - len(second)))
    elif len(first) < len(second):
        costs.extend([horrible * len(second)] * (len(second) - len(first)))

    if logger.isEnabledFor(logging.DEBUG):
        for cost in costs:
            logger.debug(cost)
    return costs

if __name__ == "__main__":
    from models import *
    logger.setLevel(logging.ERROR)

    spamlabel = Label(text = "spam")
    spampath  = Path(label = spamlabel)
    spampath.boxes.append(Box(xtl = 10, ytl = 20,
                              xbr = 30, ybr = 40,
                              frame = 0, outside = 0, occluded = 0))
    spampath.boxes.append(Box(xtl = 50, ytl = 80,
                              xbr = 80, ybr = 90,
                              frame = 100, outside = 0, occluded = 0))

    assert tolerable(0.5)(spampath, spampath) == 0
    assert validate([spampath], [spampath], tolerable(0.5)) == True

    hampath   = Path(label = spamlabel)
    hampath.boxes.append(Box(xtl = 10, ytl = 20,
                             xbr = 30, ybr = 40,
                             frame = 0, outside = 0, occluded = 0))
    hampath.boxes.append(Box(xtl = 55, ytl = 85,
                             xbr = 85, ybr = 95,
                             frame = 100, outside = 0, occluded = 0))

    assert tolerable(0.25)(spampath, hampath) == 0
    assert validate([spampath], [hampath], tolerable(0.25)) == True

    hamlabel  = Label(text = "pam")
    hampath   = Path(label = hamlabel)
    hampath.boxes.append(Box(xtl = 10, ytl = 20,
                             xbr = 30, ybr = 40,
                             frame = 0, outside = 0, occluded = 0))
    hampath.boxes.append(Box(xtl = 50, ytl = 80,
                             xbr = 80, ybr = 90,
                             frame = 100, outside = 0, occluded = 0))

    assert tolerable(0.1)(spampath, hampath) > 0
    assert validate([spampath], [hampath], tolerable(0.1)) == False

    eggpath = Path(label = hamlabel)
    eggpath.boxes.append(Box(xtl = 10, ytl = 20,
                             xbr = 30, ybr = 40,
                             frame = 0, outside = 0, occluded = 0))
    eggpath.boxes.append(Box(xtl = 50, ytl = 80,
                             xbr = 80, ybr = 90,
                             frame = 100, outside = 0, occluded = 0))

    sausagepath = Path(label = spamlabel)
    sausagepath.boxes.append(Box(xtl = 10, ytl = 20,
                                 xbr = 30, ybr = 40,
                                 frame = 0, outside = 0, occluded = 0))
    sausagepath.boxes.append(Box(xtl = 50, ytl = 80,
                                 xbr = 80, ybr = 90,
                                 frame = 100, outside = 0, occluded = 0))

    matrix = buildmatrix([eggpath, spampath],
                         [hampath, sausagepath], tolerable(0.5))
    assert matrix[0][0] == 0
    assert matrix[1][1] == 0
    assert matrix[0][1] > 0
    assert matrix[1][0] > 0

    # eggpath = hampath
    # spampath = sausagepath

    matches = match([eggpath, spampath],
                    [hampath, sausagepath], tolerable(0.5))
    assert matches[0][0] is eggpath
    assert matches[0][1] is hampath
    assert matches[0][2] == 0
    assert matches[1][0] is spampath
    assert matches[1][1] is sausagepath
    assert matches[1][2] == 0

    baconpath = Path(label = hamlabel)
    baconpath.boxes.append(Box(xtl = 15, ytl = 25,
                               xbr = 35, ybr = 45,
                               frame = 0, outside = 0, occluded = 0))
    baconpath.boxes.append(Box(xtl = 55, ytl = 85,
                               xbr = 85, ybr = 95,
                               frame = 100, outside = 0, occluded = 0))

    matches = match([eggpath, spampath, baconpath],
                    [hampath, sausagepath], tolerable(0.5))
    assert matches[0][0] is eggpath
    assert matches[0][1] is hampath
    assert matches[1][0] is spampath
    assert matches[1][1] is sausagepath
    assert matches[2][0] is baconpath
    assert matches[2][1] is None

    matches = match([hampath, sausagepath],
                    [eggpath, spampath, baconpath], tolerable(0.5))
    assert matches[0][0] is hampath
    assert matches[0][1] is eggpath
    assert matches[1][0] is sausagepath
    assert matches[1][1] is spampath
    assert matches[2][0] is None
    assert matches[2][1] is baconpath

    assert validate([spampath, baconpath, eggpath],
                    [hampath, sausagepath], tolerable(0.5)) == False

    assert validate([spampath, eggpath],
                    [hampath, sausagepath], tolerable(0.5)) == True
