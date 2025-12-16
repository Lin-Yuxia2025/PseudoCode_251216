import { PythonShell } from 'python-shell';
import path from 'path';

export default function handler(req, res) {
  console.log('API呼び出し開始');

  // 送られてきた、エディタの文字列を取得
  const code = req.body.text

  let stdout = '';
  let responded = false;

  const pyshell = new PythonShell('test.py', {
    mode: 'text',
    pythonOptions: ['-u'],      // リアルタイムに出力を受けとる

    // pyファイルの位置を絶対パスで指定
    // resolve() パスの結合     process.cwd() で現在の作業ディレクトリを取得
    scriptPath: path.resolve(process.cwd(), 'src', 'python-scripts'),

    // PythonShellで作成される子プロセスに渡す環境変数(文字化け防止)
    env: {
      ...process.env,             // 現在の Node.js プロセスの環境変数を全てコピー
      PYTHONIOENCODING: 'utf-8',  // Pythonの標準入出力をUTF-8に
    }
  });

  // 実行したいコードをpythonに送る
  pyshell.send(code);

  // イベントリスナー登録　
  // Pythonから標準出力（print）で送られてきたメッセージを受け取ったときに呼ばれる
  // dataに送られてきた文字列が入る
  pyshell.on('message', function(data){
    stdout += data;
  });

  // Pythonから標準エラーで出力された場合、呼ばれる
  pyshell.on('stderr', function(data)  {
    console.error('Python(stderr):', data);
  });

  pyshell.end((err) => {
    console.log('Python終了');
    if (responded) return;

    if (err) {
      console.error('Python実行エラー:', err);
      responded = true;
      return res.status(500).json({ error: err.message });
    }
    try {
      const parsed = stdout ? JSON.parse(stdout) : {};
      responded = true;
      return res.status(200).json({ variables: parsed });
    } catch (e) {
      console.error('JSON変換エラー:', e, '出力:', stdout);
      responded = true;
      return res.status(500).json({ error: 'Invalid JSON from Python', raw: stdout });
    }
  });
}
