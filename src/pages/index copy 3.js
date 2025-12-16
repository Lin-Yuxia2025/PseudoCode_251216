import { useState } from 'react';
import EditorPanel from '../components/EditorPanel';
import VariablesPanel from '../components/VariablesPanel';
import OutputPanel from '../components/OutputPanel';


export default function Home() {
  const [variables, setVariables] = useState({});
  const [output, setOutput] = useState({});
  // エディタの初期コードリスト
  const problems = [
    // テンプレートリテラル(バックコーテーションで囲むと改行がそのまま使える)
// [0]  サンプル問題1 
`整数型: x ← 1
整数型: y ← 2
整数型: z ← 3
x ← y
y ← z
z ← x
y を 出力する
z を 出力する`,

// [1]  関数呼び出し(引数有り) & コメントアウト & return
`funcA(100)
funcB(200)
// コメントアウトテスト1
〇funcA(整数型: paramA)
  整数型: x ← 1                         // コメントアウトテスト2
  x ← paramA
  x を 出力する

  return

〇funcB(整数型: paramB)
  整数型: y ← 2                        
  y ← paramB

  return x`,

// [2]  配列
`整数型の配列: problemArray ← {3, 2, 1, 6, 5, 4}  // 出題用のグローバル変数
makeNewArray(problemArray)
〇makeNewArray(整数型の配列: in)
整数型の配列: out ← {}  // 要素数0の配列
整数型: i
整数型: tail
outの末尾にin[1]の値を追加する`,

// [3] スライド用
`functionA(4)

functionB()

〇functionA(整数型: paramA)
  整数型: x ← 1
  整数型: y ← 2
  整数型: z ← 3
  x ← y
  y ← z
  z ← x
  x ← paramA
  x を 出力する
  y を 出力する
  z を 出力する

  return

〇functionB()
  整数型の配列: array ← {1, 2, 3, 4, 5}
  arrayを出力する
  
  return`,

  // [4] 関数内で関数呼び出し 一旦仮引数は無視
  `funcA()
  
〇funcA()
  整数型: A ← 1
  funcB()

  return

〇funcB()
  整数型: B ← 2
  funcC()

  return

〇funcC()
  整数型: C ← 3

  return`

  ];

  const NUMBER = 4; // プログラム選択
  const problemCode = problems[NUMBER];


  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* 左側 */}
      {/* problemCode (エディタに載せるコード) */}
      {/* setResult に setVariables関数 を入れて渡す(EditorPanelで variables を更新できる) */}
      <EditorPanel problemCode={problemCode} setResult={setVariables} variables={variables} setOutput={setOutput} output={output} />

      {/* 右側：上に変数一覧、下に出力*/}
      <div
        style={{
          flex: '1 1 50%',         // エディタとの横幅
          display: 'flex',
          flexDirection: 'column', // 縦並び
          gap: '1rem',  
        }}>
        {/* 変数一覧に載せる、variablesを渡す */}
        <div style={{height: 380}}>
          <VariablesPanel variables={variables} />
        </div>
        <div style={{height: 180}}>
          <OutputPanel output={output} />
        </div>
      </div>
    </div>
  );
}
