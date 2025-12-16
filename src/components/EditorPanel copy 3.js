import React, { useState } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/ruby';
import 'brace/theme/xcode';

// 親(index)から渡された props 中の problemCode, setResult, variables を分割代入 (直接使える)
function EditorPanel({ problemCode, setResult, variables }) {
  const [text, setText] = useState(problemCode);  // 初期値に渡された problemCode
  const [currentLine, setCurrentLine] = useState(0); // 現在の行番号  次に実行する行の表示にも使える？

  // 1行ずつに分けて実行
  const parseCode = async () => {
    const lines = text.split('\n');     // 改行で区切ってエディタの文を配列に

    // 全て実行したか
    if (currentLine >= lines.length) {  
      alert('すべての行を実行しました');
      return;
    }

    // エディタのtextをpyで構文解析するため、APIに送る  async(非同期)
    const res = await fetch('/api/run-python', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // linesの現在の行 と 現在の変数 (オブジェクト)を JSON文字列に変換して送る
      body: JSON.stringify({ text: lines[currentLine], variables }),   
      // ↑  req.body.text (variables) で送った値を取り出せる
    });

    // 返ってきたResponseオブジェクト(res)に入ったJSON形式の値をJavaScriptオブジェクトに変換
    const data = await res.json();

    // setResult(setVariables)を呼び出して、解析実行後の値(variables)で更新
    setResult(data.variables);  // 結果が親(index.js)へコールバック → VariablesPanel に渡される

    setCurrentLine(currentLine + 1); // 次の行へ

    // 全て実行したか
    if (currentLine >= lines.length) {  
      alert('すべての行を実行しました');
    }
  };

  return (
    <div style={{ flex: '1 1 50%' }}>
      <button onClick={parseCode}>解析して実行</button>
      <AceEditor
        mode="ruby"
        theme="xcode"
        value={text}
        onChange={setText}
        width="100%"
        name="ace-editor"
        editorProps={{ $blockScrolling: false }}
        setOptions={{ tabSize: 2}}  // tabSize: 2 タブキーを押したときのインデント
        style={{ height: '300px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: 8 }}
      />
    </div>
  );
}

export default EditorPanel;
