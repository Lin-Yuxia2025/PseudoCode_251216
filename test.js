var {PythonShell} = require('python-shell');
var pyshell = new PythonShell('test.py');

pyshell.send('太郎');

pyshell.on('message', function (data) {
  console.log(data);
});