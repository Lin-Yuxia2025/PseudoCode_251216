import React, { useRef, useState, memo } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/ruby';
import 'brace/theme/xcode';

export const AceCodeEditor = memo(() => {
  const editorRef = useRef(null);
  const [textValue, setTextValue] = useState(`整数型:x←1`);
  const [variables, setVariables] = useState({});

  const handleChange = (value) => setTextValue(value);

  const sendToPython = async () => {
    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textValue }),
      });
      const data = await res.json();
      setVariables(data.variables || {});
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: '1 1 50%' }}>
        <button onClick={sendToPython}>変数解析</button>
        <AceEditor
          ref={editorRef}
          mode="ruby"
          theme="xcode"
          onChange={handleChange}
          value={textValue}
          width="100%"
          style={{ height: '200px', marginTop: '1rem' }}
        />
      </div>
      <div
        style={{
          flex: '1 1 50%',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          background: '#fafafa',
        }}
      >
        <h3>変数一覧</h3>
        <pre>{JSON.stringify(variables, null, 2)}</pre>
      </div>
    </div>
  );
});
