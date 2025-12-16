import { PythonShell } from 'python-shell';
import path from 'path';

export default function handler(req, res) {
  console.log('API呼び出し開始');

  // リクエストで送られてきた、エディタの文字列を取得
  const code = req.body.text

  // pythonから送られた、文字列が入る
  let stdout = '';

  // API resolved without sending a response の警告を消すために、ハンドラ関数がレスポンス完了まで待つ
  // Promise 非同期処理の操作が完了したときに結果を返す
  return new Promise((resolve) => {
    // レスポンスが送信完了したら必ず resolve（誤検知防止）
    // const settle = () => resolve();
    res.once('finish', resolve);
    res.once('close', resolve);

    const pyshell = new PythonShell('test.py', {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: path.resolve(process.cwd(), 'src', 'python-scripts'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    pyshell.send(code);

    pyshell.on('message', (data) => {
      stdout = data; // 最後の行を使う運用
    });

    pyshell.on('stderr', (data) => {
      console.error('Python(stderr):', data);
    });

    pyshell.on('error', (procErr) => {
      console.error('Pythonプロセスエラー:', procErr);
      // ここでレスポンスを返すと 'finish' イベントで resolve される
      if (!res.headersSent) res.status(500).json({ error: procErr.message });
      // すでに送っていれば settle が走るので何もしない
    });

    pyshell.end((endErr) => {
      console.log('Python終了');

      if (endErr) {
        console.error('Python実行エラー:', endErr);
        if (!res.headersSent) res.status(500).json({ error: endErr.message });
        return; // resolve は 'finish'/'close' で行われる
      }

      try {
        const parsed = stdout ? JSON.parse(stdout) : {};
        if (!res.headersSent) res.status(200).json({ variables: parsed });
      } catch (e) {
        console.error('JSON変換エラー:', e, '出力:', stdout);
        if (!res.headersSent) res.status(500).json({ error: e.message, raw: stdout });
      }
      // resolve は 'finish' イベントで自動
    });
  });
}
