import { PythonShell } from 'python-shell';

export default function handler(req, res) {
  PythonShell.run('test.py', null, function (err, results) {
    if (err) {
      res.status(500).json({ error: err.toString() });
    } else {
      res.status(200).json({ result: results });
    }
  });
}