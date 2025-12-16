const { PythonShell } = require('python-shell');

export default function handler(req, res) {
  const inputText = req.body.text || '';    // textがなければ '' 空白

  let result = '';

  const pyshell = new PythonShell('test.py', {
    mode: 'text',
    pythonOptions: ['-u'],              // バッファリングなし
    scriptPath: './src/python-scripts', // test.pyのある場所
  });

  // Pythonへメッセージの送信
  // .endの後ろに付けるとエラー
  pyshell.send(inputText);

  // Pythonからメッセージの受け取り
  pyshell.on('message', function (data) {
    result += data + '\n';
  });

  // Pythonの終了
  pyshell.end(function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ result: result.trim() });
  });
}
