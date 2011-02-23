import munkres

def match(first, second, method):
    """
    Attempts to match every path in 'first' with a path in 'second'. Returns 
    the association along with its score. 

    Note: if two paths have nothing to do with each other, but there is no
    other suitable candidate, the two seeminly unrelated paths will be
    associated. It is up to the caller to handle this situation. The 'validate'
    method may provide some help. Further, if len(first) != len(second), then
    some elements will be associated with None.
    """
    if len(first) == len(second) == 0:
        return []

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
    return costs
