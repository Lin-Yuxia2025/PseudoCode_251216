import React, { useState, memo } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/ruby';
import 'brace/theme/xcode';

const EditorPanel = memo(function EditorPanel({ initialText = '', onResult }) {
  const [text, setText] = useState(initialText);

  const analyze = async () => {
    const res = await fetch('/api/run-python', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    onResult?.(data.variables || {}); // ← 結果だけ親へコールバック
  };

  return (
    <div style={{ flex: '1 1 50%' }}>
      <button onClick={analyze}>Pythonで解析して右に表示</button>
      <AceEditor
        mode="ruby"
        theme="xcode"
        value={text}
        onChange={setText}
        width="100%"
        name="ace-editor"
        editorProps={{ $blockScrolling: false }}
        setOptions={{ tabSize: 2, showPrintMargin: true }}
        style={{ height: '300px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: 8 }}
      />
    </div>
  );
});

export default EditorPanel;
