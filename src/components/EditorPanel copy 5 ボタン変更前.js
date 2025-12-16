import React, { useState, useRef, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/ruby';
import 'brace/theme/xcode';

// 親(index)から渡された props 中の problemCode, setResult, globalVars setOutput output を分割代入 (直接使える)
function EditorPanel({ problemCode, setResult, globalVars, setOutput, output, setcallStack, callStack }) {
  const [text, setText] = useState(problemCode);      // エディタのコード　(初期値は渡された problemCode)
  const [currentLine, setCurrentLine] = useState(0);  // 現在の行番号
  const [functions, setFunctions] = useState({});     // 関数定義の行番号など
  const [globalState, setglobalState] = useState({}); // グローバルスコープのif文などのステート
  const editorRef = useRef(null);                     // Aceエディタの参照  (次に実行するLineの印用)

  // currentLine(次に実行) の行に 印(GutterDecoration)を付ける
  useEffect(() => {
    const editor = editorRef.current.editor;   // AceEditorのオブジェクト
    if (!editor) return;                       // エディタがまだ、なければリターン
    const session = editor.getSession();       // 現在開いているテキストの 編集セッションを取得
    const total = session.getLength();         // エディタの行数を取得

    // 全てのマークを消す(前の行だけを消そうとすると、残ることがあった)
    for (let i = 0; i < total; i++) {
      session.removeGutterDecoration(i, 'next-line-marker');                // 行を消す
    }
    
    // 全て実行していなければ、現在の行にだけマークを付ける
    if (currentLine < total) {
      session.addGutterDecoration(currentLine, 'next-line-marker');         // マークを付ける
    } 
  }, [currentLine, text]);  // currentLine または text が変わったとき、処理


  // 1行ずつに分けて解析・実行
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
      // lines(コードを分けた配列)、 現在の変数、 、グローバルスコープのステート、 出力、 次に実行する行番号、 関数定義の情報、　関数呼び出し を JSON文字列に変換して送る
      body: JSON.stringify({ text: lines, globalVars, globalState, output, currentLine, functions, callStack }),   
      // ↑  req.body.text (globalVars)(currentLine) で送った値を取り出せる
    });

    // 返ってきたResponseオブジェクト(res)に入ったJSON形式の値をJavaScriptオブジェクトに変換
    const data = await res.json();

    // pythonからerrorが返ってきた場合
    if(data.error){
      alert(data.error);
      return;
    }

    // setResult, setglobalVars, setFunctions を呼び出して、解析実行後の値で更新
    setResult(data.globalVars);        // 結果が親(index.js)へコールバック → VariablesPanel に渡される
    setglobalState(data.globalState);
    setOutput(data.output);           //                〃
    setFunctions(data.functions);     // 関数定義の行番号などを登録 (一行目実行時のみ)
    setCurrentLine(data.currentLine); // 次の行へ  (python側で決めたcurrentLineをセットする)
    setcallStack(data.callStack);       // 関数の呼び出し情報をセット
  };

  // すべて初期状態に戻す
  const resetAll = () => {
    setResult({});          // 変数を空に
    setglobalState({});     // グローバルスコープのステート
    setOutput({});          // 出力を空に
    setFunctions({});       // 関数定義をリセット
    setText(problemCode);   // エディタのコードを最初に戻す
    setCurrentLine(0);      // 行番号を0に戻す
    setcallStack([]);       // 関数呼び出しリセット
  };


   // ボタン用スタイル
  const buttonBarStyle = {
    marginTop: '0.6rem',
    display: 'flex',
    gap: '1.2rem',
    justifyContent: 'flex-start', // 左寄せ（左下あたり）
  };

  const iconButtonStyle = {
    width: 42,
    height: 42,
    borderRadius: 8,
    border: '1px solid #555',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };


  return (
    <div style={{ flex: '1 1 50%', gap:'1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={parseCode}>解析して実行</button>
        <button onClick={resetAll}>リセット</button>
      </div>
      <AceEditor
        ref={editorRef}
        mode="ruby"
        theme="xcode"
        value={text}
        onChange={setText}
        width="100%"
        name="ace-editor"
        editorProps={{ $blockScrolling: false }}
        setOptions={{ tabSize: 2}}  // tabSize: 2 タブキーを押したときのインデント
        style={{ height: '350px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: 8 }}
      />
    </div>
  );
}

export default EditorPanel;
