import React, { memo, useState, useRef, useEffect } from 'react';
import AceEditor from 'react-ace';

// Ace Editor のモード・テーマをインポート
import 'brace/mode/ruby';
import 'brace/theme/xcode';

export const AceCodeEditor = memo(() => {
  const [textValue, setTextValue] = useState(`
def sample
  puts "サンプルです"
end
`);
  const editorRef = useRef(null); // ← editorインスタンスを保持

  const handleChange = (value) => {
    setTextValue(value);
  };

  const copyLineToAnother = () => {
    const editor = editorRef.current.editor;
    const lineText = editor.session.getLine(1); // 例：2行目（インデックス1）の文字列を取得
    const lastRow = editor.session.getLength(); // 最終行の行番号を取得
    editor.session.insert({ row: lastRow, column: 0 }, lineText + '\n'); // 最後に挿入
  };

  return (
    <>
      <style>
        {`
          .ace_gutter {
            background: #0b6bcb2c !important;
          }
        `}
      </style>

      <button onClick={copyLineToAnother}>2行目の文字列を最後に表示</button>

      <AceEditor
        ref={editorRef} // ← editorインスタンスをここで取得
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
