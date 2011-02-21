"""
Quality assurance routines that take a list of candidate paths and compare
with a list of ground truth tracks.

>>> matches = match(candidates, truth)
>>> isvalid = tolerable(matches)
>>> isperfect = perfectmatch(matches)
"""

import munkres
import logging

logger = logging.getLogger("vatic.match")

class tolerable(object):
    """
    Tests if two paths agree by tolerable guidelines.
    """
    def __init__(self, overlap = 0.5, tolerance = 0.1, mistakes = 0):
        self.overlap = overlap
        self.tolerance = tolerance
        self.mistakes = mistakes

    def __call__(self, matches):
        """
        Compares matches to see if they are valid enough.
        """
        cost = 0
        for match in matches:
            firstboxes  = match[0].getboxes(interpolate = True)
            secondboxes = match[1].getboxes(interpolate = True)

            horrible = max(len(firstboxes), len(secondboxes)) + 1
            if first.label != second.label:
                return horrible
            if len(firstboxes) != len(secondboxes):
                return horrible

            cost += self.overlapcost(firstboxes, secondboxes)
        return cost <= self.mistakes

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

    def __repr__(self):
        return "tolerable({0}, {1}, {2})".format(self.overlap,
                                                 self.tolerance,
                                                 self.mistakes)

def perfetchmatch(matches):
    """
    Validator to test if there is a perfect match.
    """
    return all(x[2] == 0 for x in matches)

def continuouscost(first, second):
    firstboxes  = first.getboxes(interpolate = True)
    secondboxes = second.getboxes(interpolate = True)
    secondboxes = dict((x.frame, x) for x in secondboxes)

    if first.label != second.label:
        return max(len(firstboxes), len(secondboxes)) + 1

    cost = 0
    for firstbox in firstboxes:
        secondbox = secondboxes[firstbox.frame]
        if firstbox.lost != secondbox.lost:
            cost += 1
        else:
            cost += 1 - firstbox.percentoverlap(secondbox)
    return cost

def match(first, second, method = continuouscost):
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
