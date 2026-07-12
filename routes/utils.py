from flask import session

# Canonical flags for each part. Kept server-side only — never sent to the
# client except as the direct reward for a successful exploit request.
FLAGS = {
    1: 'flag{rate_limiting_is_hard}',
    2: 'flag{cache_poisoning_via_x_original_url}',
    3: 'flag{sqli_union_injection}',
}


def mark_solved(part_num):
    """Record a part as solved and permanently store its flag in the
    session so the header 'captured flags' widget can display it."""
    solved = session.get('solved', [])
    if part_num not in solved:
        solved.append(part_num)
        session['solved'] = solved

    flags = session.get('flags', {})
    flags[str(part_num)] = FLAGS.get(part_num)
    session['flags'] = flags

    session.modified = True
    return True
