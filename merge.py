"""
Merges paths across segments. Typical usage:

>>> for boxes, path in merge(segments):
...     pass
"""

from match import match

def percentoverlap(first, second):
    """
    Scores two paths, first and second, to see if they are the same path.

    A lower score is better. 0 is a perfect match. This method will assign a
    an extremely high score to paths that disagree on labels (a car cannot
    suddenly transform into a person). If labels match, then scores based
    off percent overlap in the intersecting timeline.
    """
    firstboxes  = first.getboxes(interpolate = True)
    secondboxes = second.getboxes(interpolate = True)
    secondboxes = dict((x.frame, x) for x in secondboxes)

    if first.label != second.label:
        return max(len(firstboxes), len(secondboxes)) + 1

    cost = 0
    for firstbox in firstboxes:
        if firstbox.frame in secondboxes:
            secondbox = secondboxes[firstbox.frame]
            if firstbox.lost != secondbox.lost:
                cost += 1
            else:
                cost += 1 - firstbox.percentoverlap(secondbox)
    return cost

def overlapsize(first, second):
    """
    Counts the number of frames in first that temporally overlap with second.
    """
    return len(set(f.frame for f in first) & set(s.frame for s in second))

def merge(segments, method = percentoverlap, threshold = 0.5):
    """
    Takes a list of segments and attempts to find a correspondance between
    them by returning a list of merged paths.

    Uses 'method' to score two candidate paths. If the score returned by
    'method' is greater than the number of overlaping frames times the 
    threshold, then the correspondance is considered bunk and a new path
    is created instead.

    In general, if 'method' returns 0 for a perfect match and 1 for a
    horrible match, then 'threshold' = 0.5 is pretty good.
    """
    paths = {}
    for path in segments[0].path:
        paths[path.id] = path.getboxes(), path
    for x, y in zip(segments, segments[1:]):
        for first, second, score in match(x, y, method):
            if first is None or score > threshold * overlapsize(first, second):
                paths[second.id] = second.getboxes(), second
            elif first is not None and second is not None: 
                paths[second.id] = paths[first.id]
                paths[second.id][0].extend(second.getboxes())
                paths[second.id][1].append(second)
                del paths[first.id]
    return paths.values()
