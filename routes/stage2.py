from flask import Blueprint, request, jsonify
from .utils import FLAGS

stage2_bp = Blueprint('stage2', __name__)

# Simulated cache: stores responses under original URL path
cache = {}


@stage2_bp.route('/stage2/profile', methods=['GET'])
def profile():
    original_url = request.headers.get('X-Original-URL')
    requested_path = request.path

    # If X-Original-URL is present, treat as proxy rewrite – but DO NOT return flag immediately
    if original_url:
        if original_url == '/admin/flag':
            # The backend returns the flag, but the proxy caches it under the *original* path
            cache[requested_path] = {'flag': FLAGS[2]}
            # Return a generic success message – NOT the flag yet
            return jsonify({'message': 'Request processed and cached'})
        else:
            return jsonify({'error': 'Invalid internal path'}), 403

    # Normal request: check if cache exists for this path
    if requested_path in cache:
        cached_data = cache[requested_path]
        return jsonify({
            'exploited': True,
            'flag': cached_data['flag'],
            'message': 'Cache poisoned! Submit this flag below to complete Part 2.'
        })

    # If not cached, return normal profile
    return jsonify({'profile': {'username': 'guest', 'email': 'guest@example.com'}})
