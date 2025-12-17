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

# vercelで動かす場合、indexでなくファイル名(/api/run-python)を探す
# とりあえずここを試す。
@app.route("/", methods=["POST"])        # このファイル自体が/api/run-pythonだから"/"
def run_python():
    state = request.get_json()          # リクエストのJSON文字列をPythonの辞書に変換して取得

    result = parse_run(state)           # 呼び出し実行

    return jsonify(result)              # Pythonの辞書をJSON形式のレスポンスに変換して返す
