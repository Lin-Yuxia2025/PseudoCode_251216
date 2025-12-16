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
  const [variables, setVariables] = useState({}); // 右側に表示する変数

  const handleChange = (value) => {
    setTextValue(value);
    // ここで変数解析や値取得をしてsetVariables更新も可能
  };

  const sendLineToPython = async () => {
    const editor = editorRef.current.editor;
    const lineText = editor.session.getLine(1); // 例：2行目
    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lineText }),
      });
      const data = await res.json();
      // Pythonから返った値を右側に表示
      setVariables((prev) => ({ ...prev, result: data.result }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', gap: '1rem' }}>
      {/* 左側エディタ */}
      <div style={{ flex: '1 1 50%' }}>
        <button onClick={sendLineToPython}>
          2行目をPythonに送り→結果を右に表示
        </button>
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
            height: '300px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginTop: '10px',
          }}
        />
      </div>

      {/* 右側パネル */}
      <div
        style={{
          flex: '1 1 50%',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          background: '#fafafa',
        }}
      >
        <h3>変数の値</h3>
        <pre>{JSON.stringify(variables, null, 2)}</pre>
      </div>
    </div>
  );
});
