from flask import Flask, request, jsonify
import sys
from pathlib import Path

app = Flask(__name__)

# src/python-scriptsからimportできるように
root = Path(__file__).resolve().parent.parent
py_scripts = root / "src" / "python-scripts"
sys.path.append(str(py_scripts))

# parse.pyから関数parseを取得
import parse
parse_run = parse.parse

@app.route('/api/run-python', methods=['POST'])
def run_python():
    state = request.get_json()

    result = parse_run(state)

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5328, debug=False, use_reloader=False)

