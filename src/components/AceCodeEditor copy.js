import React, { memo, useState } from 'react';
import AceEditor from 'react-ace';

// Ace Editor のモード・テーマをインポート
import 'brace/mode/ruby';
import 'brace/theme/xcode';

// マーカーの設定（TypeScriptの型は削除）
const markers = [
  {
    startRow: 3,
    startCol: 1,
    endRow: 4,
    endCol: 1,
    className: 'ruby-editor',
    type: 'text',
    inFront: true,
  },
];

// JavaScript では props 型指定は不要
export const AceCodeEditor = memo(({ useDelay }) => {
  const [textValue, setTextValue] = useState(`
def sample
  puts "サンプルです"
end
`);

  const handleChange = (value) => {
    setTextValue(value);
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
      <AceEditor
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
        }}
        markers={markers}
      />
    </>
  );
});
