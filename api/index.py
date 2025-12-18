from flask import Flask, request, jsonify 

try:                    # Vercelで起動時は成功
    from . import parse # vercelで実行時、この書き方じゃないとインポートできない
except ImportError:     # Localで実行すると失敗
    import parse

app = Flask(__name__)

# parse.pyから関数parseを取得
parse_run = parse.parse

@app.route('/api/run-python', methods=['POST'])
def run_python():
    state = request.get_json()      # リクエストのJSON文字列をPythonの辞書に変換して取得

    result = parse_run(state)       # 呼び出し実行

    return jsonify(result)          # Pythonの辞書をJSON形式のレスポンスに変換して返す