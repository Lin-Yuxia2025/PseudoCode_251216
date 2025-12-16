import { PythonShell } from 'python-shell';
import path from 'path';

export default function handler(req, res) {
  const code = req.body.text || '';

  let result = '';

  const pyshell = new PythonShell('test.py', {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './src/python-scripts', // test.pyのある場所
    // scriptPath: path.resolve(process.cwd(), 'src', 'python-scripts')
  });

  pyshell.send(code);

  pyshell.on('message', function (data) {
    result += data;
  });

  pyshell.end(function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    try {
      const parsed = JSON.parse(result);
      return res.status(200).json({ variables: parsed });
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON from Python' });
    }
  });
}
