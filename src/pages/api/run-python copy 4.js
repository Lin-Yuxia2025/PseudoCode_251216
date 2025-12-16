import { PythonShell } from 'python-shell';
import path from 'path';

export default function handler(req, res) {
  console.log('API呼び出し開始');
  const code = req.body.text || '';
  let result = '';

  const pyshell = new PythonShell('test.py', {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.resolve(process.cwd(), 'src', 'python-scripts'),
  });

  pyshell.send(code);

  pyshell.on('message', function (data) {
    console.log('Python出力:', data);
    result += data;
  });

  pyshell.end(function (err) {
    console.log('Python終了');
    if (err) {
      console.error('Python実行エラー:', err);
      return res.status(500).json({ error: err.message });
    }
    try {
      const parsed = JSON.parse(result);
      console.log('解析結果:', parsed);
      return res.status(200).json({ variables: parsed });
    } catch (e) {
      console.error('JSON変換エラー:', e);
      return res.status(500).json({ error: 'Invalid JSON from Python' });
    }
  });
}
