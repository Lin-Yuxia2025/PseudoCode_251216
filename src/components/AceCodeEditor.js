import React, { useRef, useState, memo } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/ruby';
import 'brace/theme/xcode';

export const AceCodeEditor = memo(() => {
  const editorRef = useRef(null);
  const [textValue, setTextValue] = useState(`整数型:x←1\n整数型:y←2`);
  const [variables, setVariables] = useState({});

  const handleChange = (value) => setTextValue(value);

  const sendToPython = async () => {
    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textValue }), // エディタ全文を送る
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('API Error:', data);
        return;
      }
      setVariables(data.variables || {});

    } catch (err) {
      console.error('fetch失敗:', err);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
      <div style={{ flex: '1 1 50%' }}>
        <button onClick={sendToPython}>Pythonで解析して右に表示</button>
        <AceEditor
          ref={editorRef}
          mode="ruby"
          theme="xcode"
          onChange={handleChange}
          value={textValue}
          width="100%"
          style={{ height: '300px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: 8 }}
          name="ace-editor"
          editorProps={{ $blockScrolling: false }}
          setOptions={{ tabSize: 2, showPrintMargin: true }}
        />
      </div>

      <div style={{ flex: '1 1 50%', border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#fafafa' }}>
        <h3>変数一覧</h3>
        <pre>{JSON.stringify(variables, null, 2)}</pre>
      </div>
    </div>
  );
});
