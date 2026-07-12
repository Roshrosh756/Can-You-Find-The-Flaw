from flask import Blueprint, request, jsonify
from sqlalchemy import text
from database import engine
from .utils import FLAGS

stage3_bp = Blueprint('stage3', __name__)

REAL_FLAG = FLAGS[3]


@stage3_bp.route('/stage3/product', methods=['GET'])
def product():
    pid = request.args.get('id', '1')
    # Direct interpolation – vulnerable to SQL injection
    query = f"SELECT id, name, price FROM products WHERE id = {pid}"
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            products = [{'id': r[0], 'name': r[1], 'price': r[2]} for r in rows]
            # Check if flag appears in any row
            for r in rows:
                if REAL_FLAG in str(r):
                    return jsonify({
                        'exploited': True,
                        'flag': REAL_FLAG,
                        'message': 'Flag extracted! Submit it below to complete Part 3.',
                        'products': products
                    })
            return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
