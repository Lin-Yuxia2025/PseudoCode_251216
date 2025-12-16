import { PythonShell } from 'python-shell';
import path from 'path';

export default function handler(req, res) {
  console.log('API呼び出し開始');

  // リクエストで送られてきた値を取得
  let variables = req.body.variables;
  const code = req.body.text;

  // python からの出力を受け取る変数
  let stdout = '';

  // API resolved without sending a response 警告への対策として、レスポンス完了まで待つために、
  // Promise で囲んで非同期処理の完了を待つ
  return new Promise((resolve) => {
    // PythonShell で Python スクリプトを実行
    const pyshell = new PythonShell('test.py', {
      mode: 'text',
      pythonOptions: ['-u'],  // リアルタイム出力
      // py ファイルの位置を絶対パスで指定
      // resolve() パスの結合     process.cwd() で現在の作業ディレクトリを取得
      scriptPath: path.resolve(process.cwd(), 'src', 'python-scripts'),
      // PythonShellで作成される子プロセスに渡す環境変数(文字化け防止)
      env: {
        ...process.env,           // 現在の Node.js プロセスの環境変数を全てコピー
        PYTHONIOENCODING: 'utf-8' // Pythonの標準入出力をUTF-8に
      }
    });

    // Python に送るデータ（実行コードと現在の変数一覧）
    pyshell.send(JSON.stringify({
      code,
      variables
    }));

    // Python の標準出力（printの内容）を受け取る
    pyshell.on('message', function (data) {
      stdout = data;
    });

    // Python の標準エラー出力
    pyshell.on('stderr', function (data) {
      console.error('Python(stderr):', data);
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
        // JavaScriptオブジェクト { variables: parsed } をJSON形式に変換して、結果を返す
        res.status(200).json({ variables: parsed });
      } catch (e) {
        console.error('JSON変換エラー:', e);
        res.status(500).json({ error: e.message });
      }
      resolve();    // Promise の完了
    });
  });
}
