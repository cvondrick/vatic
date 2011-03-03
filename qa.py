from match import match

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
        Allows this object to be called as a function to invoke validation.
        """
        return self.validate(first, second)

    def validate(self, first, second):
        """
        Compares first to second to determine if they sufficiently agree.
        """
        matches = match(first, second,
                        lambda x, y: self.overlapcost(x, y))
        return sum(x[2] != 0 for x in matches) <= self.mistakes

    def overlapcost(self, first, second):
        """
        Computes the overlap cost between first and second. Both will be
        linearly filled.
        """
        firstboxes  = first.getboxes(interpolate = True)
        secondboxes = second.getboxes(interpolate = True)

        horrible = max(len(firstboxes), len(secondboxes)) + 1
        if first.label != second.label:
            return horrible
        if len(firstboxes) != len(secondboxes):
            return horrible

        cost = 0
        for f, s in zip(firstboxes, secondboxes):
            if f.lost != s.lost:
                cost += 1
            elif f.percentoverlap(s) < self.overlap:
                cost += 1
        return max(0, cost - float(len(firstboxes)) * self.tolerance)

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
