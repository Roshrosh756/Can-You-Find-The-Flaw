from flask import Blueprint, request, jsonify
from .utils import mark_solved, FLAGS

submit_bp = Blueprint('submit', __name__)


@submit_bp.route('/submit/<int:part>', methods=['POST'])
def submit_flag(part):
    if part not in FLAGS:
        return jsonify({'error': 'Invalid part'}), 400

    data = request.get_json(silent=True) or {}
    flag = (data.get('flag') or '').strip()

    if not flag:
        return jsonify({'error': 'Missing flag'}), 400

    if flag == FLAGS[part]:
        mark_solved(part)
        return jsonify({'solved': True, 'part': part, 'flag': flag})

    return jsonify({'solved': False, 'error': 'Incorrect flag'}), 400
