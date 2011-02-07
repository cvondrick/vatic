"""
Quality assurance routines that take a list of candidate paths and compare
with a list of ground truth tracks.

>>> validate(candidates, truth, strict(0.5))
True
"""

import munkres
from vision.track.interpolation import LinearFill

class strict(object):
    """
    Tests if two paths agree by very strict guidelines and only grants
    forgiveness on the overlap.
    """
    def __init__(self, overlap = 0.5):
        self.overlap = overlap

    def __call__(self, first, second):
        horrible = max(len(first), len(second)) + 1
        if first.labelid != second.labelid:
            return horrible

        first  = LinearFill(first.annotations)
        second = LinearFill(second.annotations)
        if len(first) != len(second):
            return horrible

        return self.matchcost(first, second)

    def matchcost(self, first, second):
        cost = 0
        for f, s in zip(first, second):
            if f.lost != s.lost:
                cost += 1
            elif f.percent_overlap(s) > self.overlap:
                cost += 1
        return cost

    def validate(self, matches):
        return all(x[2] == 0 for x in matches)

class ignorelost(strict):
    def matchcost(self, first, second):
        second = dict((s.frame, s) for s in second)
        cost = 0
        for f in first.annotations:
            if f.frame in second and not f.lost and not pboxes[p.frame].lost:
                if f.percent_overlap(second[s.frame]) > overlap:
                    cost += 1
        return cost

def validate(first, second, method = strict(0.5)):
    """
    Uses 'method' to validate the assignment to make sure it's adequate
    """
    return method.validate(match(first, second, method))

def match(first, second, method = strict(0.5)):
    """
    Attempts to match every path in 'first' with a path in 'second'. Returns 
    the association along with its score.
    """
    costs = [[method(f, s) for s in second] for f in first]
    response = []
    for f, s in munkres.Munkres().compute(costs):
        response.append((first[f], second[s], costs[f][s]))
    return response
