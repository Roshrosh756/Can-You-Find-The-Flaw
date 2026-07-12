from flask import Flask, session, render_template, jsonify
from datetime import datetime, timezone

from routes import stage1_bp, stage2_bp, stage3_bp, hints_bp, submit_bp

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'  # CHANGE THIS

# Register blueprints
app.register_blueprint(stage1_bp, url_prefix='/api')
app.register_blueprint(stage2_bp, url_prefix='/api')
app.register_blueprint(stage3_bp, url_prefix='/api')
app.register_blueprint(hints_bp, url_prefix='/api')
app.register_blueprint(submit_bp, url_prefix='/api')


@app.before_request
def init_session():
    # No login/callsign step -- every visitor gets an anonymous session
    # the moment they load the page, and the clock starts right then.
    if 'start_time' not in session:
        session['start_time'] = datetime.now(timezone.utc).isoformat()
    if 'solved' not in session:
        session['solved'] = []
    if 'flags' not in session:
        session['flags'] = {}


# ========== MAIN ROUTES ==========
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/check_solved')
def api_check_solved():
    return jsonify({'solved': session.get('solved', [])})


@app.route('/api/flags')
def api_flags():
    """Captured flags for the header widget -- flags persist here for the
    rest of the session instead of only flashing in a toast."""
    return jsonify({
        'solved': session.get('solved', []),
        'flags': session.get('flags', {})
    })


@app.route('/api/session_status')
def session_status():
    start_raw = session.get('start_time')
    elapsed = 0
    if start_raw:
        start = datetime.fromisoformat(start_raw)
        elapsed = int((datetime.now(timezone.utc) - start).total_seconds())
    return jsonify({
        'elapsed': elapsed,
        'solved': session.get('solved', [])
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
