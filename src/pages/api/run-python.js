import { PythonShell } from 'python-shell';
import path from 'path';

export default function handler(req, res) {
  console.log('API呼び出し開始');

  // リクエストで送られてきた値を取得
  let globalVars = req.body.globalVars;
  let globalState = req.body.globalState;
  let output = req.body.output; 
  const codes = req.body.text;
  let currentLine = req.body.currentLine;
  const functions = req.body.functions;
  let callStack = req.body.callStack;
  const runButton = req.body.runButton;

  // python からの出力を受け取る変数
  let stdout = '';

  // API resolved without sending a response 警告への対策として、レスポンス完了まで待つために、
  // Promise で囲んで非同期処理の完了を待つ
  return new Promise((resolve) => {
    // PythonShell で Python スクリプトを実行
    const pyshell = new PythonShell('parse.py', {
      mode: 'text',
      pythonOptions: ['-u'],  // リアルタイム出力
      // pyファイルの位置を絶対パスで指定
      // resolve() パスの結合     process.cwd() で現在の作業ディレクトリを取得
      scriptPath: path.resolve(process.cwd(), 'src', 'python-scripts'),
      // python-shellで作成される子プロセスに渡す環境変数(文字化け防止のため)
      env: {
        ...process.env,           // 現在の Node.js プロセスの環境変数を全てコピー
        PYTHONIOENCODING: 'utf-8' // Pythonの標準入出力をUTF-8に
      }
    });

    // Python に送るデータ（実行コード、現在の変数一覧、出力、次に実行する行番号、関数、関数呼び出し、実行ボタン）
    pyshell.send(JSON.stringify({
      codes,
      globalVars,
      globalState,
      output,
      currentLine,
      functions,
      callStack,
      runButton,
    }));

    // Python の標準出力（printの内容）を受け取る
    pyshell.on('message', function (result) {
      stdout = result;
    });

    // Python の標準エラー出力
    pyshell.on('stderr', function (result) {
      console.error('Python(stderr):', result);
    });

    // Python 実行終了時の処理
    pyshell.end(function (err) {
      console.log('Python終了');

      if (err) {
        console.error('Python実行エラー:', err);
        res.status(500).json({ error: err.message });
        return resolve();   // Promise の完了
      }
      try {
        // Pythonから返ってきたJSON文字列をオブジェクトに変換
        const parsed = JSON.parse(stdout);
        // JavaScriptオブジェクト(parsed)をJSON形式に変換して、結果を返す
        res.status(200).json(parsed);
      } catch (e) {
        console.error('JSON変換エラー:', e);
        res.status(500).json({ error: e.message });
      }
      resolve();    // Promise の完了
    });
  });
}
