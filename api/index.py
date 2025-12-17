from flask import Flask, request, jsonify
from . import parse             # この書き方じゃないとインポートできない

app = Flask(__name__)

# parse.pyから関数parseを取得
parse_run = parse.parse

# Flaskが(このファイルで)起動していなければ(vercelで実行時)、/api/run-pythonで呼んでも、こっちは動かない
@app.route('/api/run-python', methods=['POST'])
def run_python():
    state = request.get_json()      # リクエストのJSON文字列をPythonの辞書に変換して取得

    result = parse_run(state)       # 呼び出し実行

    return jsonify(result)          # Pythonの辞書をJSON形式のレスポンスに変換して返す