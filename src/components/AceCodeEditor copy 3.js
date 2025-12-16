import React, { useRef, useState, memo } from 'react';
import AceEditor from 'react-ace';

import 'brace/mode/ruby';
import 'brace/theme/xcode';

export const AceCodeEditor = memo(() => {
  const editorRef = useRef(null);
  const [textValue, setTextValue] = useState(`
def sample
  puts "サンプルです"
end
`);

  const handleChange = (value) => {
    setTextValue(value);
  };

  const sendLineToPython = async () => {
    const editor = editorRef.current.editor;

    // 取得したい行番号（例：1 → 2行目）
    const targetRow = 1;
    const lineText = editor.session.getLine(targetRow);

    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lineText }),
      });

      const data = await res.json();
      const newText = data.result;

      // 最終行に追加
      const lastRow = editor.session.getLength();
      editor.session.insert({ row: lastRow, column: 0 }, newText + '\n');
    } catch (err) {
      console.error('Python呼び出し失敗:', err);
    }
  };

  return (
    <>
      <button onClick={sendLineToPython}>2行目をPythonに送り→結果を末尾に追加</button>

      <AceEditor
        ref={editorRef}
        mode="ruby"
        theme="xcode"
        onChange={handleChange}
        width="100%"
        name="ace-editor"
        editorProps={{ $blockScrolling: false }}
        value={textValue}
        showGutter={true}
        highlightActiveLine={true}
        showPrintMargin={true}
        setOptions={{
          enableBasicAutocompletion: false,
          enableLiveAutocompletion: false,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
        }}
        style={{
          width: '100%',
          height: '300px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginTop: '10px',
        }}
      />
    </>
  );
});
