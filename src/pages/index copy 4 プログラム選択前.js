import { useState } from 'react';
import EditorPanel from '../components/EditorPanel';
import VariablesPanel from '../components/VariablesPanel';
import OutputPanel from '../components/OutputPanel';


export default function Home() {
  const [globalVars, setglobalVars] = useState({});
  const [output, setOutput] = useState({});
  const [callStack, setcallStack] = useState([]);                         // 関数が呼び出されるたびにステートを重ねる
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);    // プログラム選択

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

// [1]  関数呼び出し(引数有り) & コメントアウト & return     現在使用不可
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
  outの末尾にin[1]の値を追加する
  return`,

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
`整数型: Z ← 500
funcA()
  
〇funcA()
  整数型: A ← 1
  Aを出力する
  funcB()

  return

〇funcB()
  整数型: B ← 2
  Bを出力する
  funcC()

  return

〇funcC()
  整数型: C ← 3
  Cを出力する

  return`,

// [5] 関数の返り値を代入
`整数型: x
x ← funcA()

〇funcA()
  整数型: y ← 1
  
  return y`,

// [6] if文
`整数型: result
result ← factorial(5)

〇整数型: factorial(整数型: n)
  整数型:f
  if(n = 0)    
    return 1
  endif 
  f ← factorial(n-1) 
  return n × f`,
  
// [7] for文
`func()

〇func()
  整数型: i
  for(i を 1 から 5 まで 1 ずつ増やす)
    i を 出力する
  endfor
`,

// [8] サンプル問題3 (配列の要素までの値を足したものをそれぞれ、新しい配列の要素として返す)
`整数型の配列: array ← {3, 2, 1, 6, 5, 4}
整数型の配列: result ← {}  // 要素数0の配列

result ← makeNewArray(array)

〇整数型の配列: makeNewArray(整数型の配列: in)
  整数型の配列: out ← {}   // 要素数0の配列
  整数型: i
  整数型: tail
  out の末尾に in[1] の値を追加する
  for (i を 2 から inの要素数 まで 1 ずつ増やす)
    tail ← out[outの要素数]
    outの末尾に(tail + in[i]) の結果を追加する
  endfor
  return out
`,

// [9] while文
`整数型:a ← 1

while (a < 5)
  a を出力する
  a ← a + 1
endwhile

`,

// [10] サンプル問題13 targetが配列の何番にあるかを探す (無限ループになってしまうプログラム)
`整数型の配列: array ← {1,2,3,4,5}
整数型: result
result ← search(array, 3)

〇整数型: search(整数型の配列: data, 整数型: target)
  整数型: low
  整数型: high
  整数型: middle

  low ← 1
  high ← dataの要素数

  while (low ≦ high)
    middle ← (low + high) ÷ 2 の商
    if (data[middle] < target)
      low ← middle
    elseif (data[middle] > target)
      high ← middle
    else
      return middle
    endif
  endwhile

  return -1
`,

// [11] do whileテスト
`整数型: i ← 0
do  
  i ← i + 1
while(i < 3)

`,

// [12] while do while ネスト 
`// ネスト、インデント
整数型: do1 ← 0
整数型: do2 ← 0
整数型: w1 ← 0
整数型: w2 ← 0

do                      // 一つ目のdowhile      1
  while (w1 < 2)        // 一つ目のwhile        2
    do                  // 二つ目のdowhile      3
      while(w2 < 2)     // 二つ目のwhile        4
        w2 ← w2 + 1
      endwhile          // 二つ目のwhile最後     4
      do2 ← do2 + 1     
    while(do2 < 2)      // 二つ目のdowhile最後   3
    w1 ← w1 + 1         
  endwhile              // 一つ目のwhile最後     2
  do1 ← do1 + 1
while(do1 < 2)          // 一つ目のdowhile最後   1

`,

// [13] 変数表示テスト
`// 変数表示テスト
整数型: g ← 100
g を 出力する
整数型の配列: array1 ← {1}
整数型の配列: array2 ← {1, 2, 3}
整数型の配列: array3 ← {1, 2, 3, 4, 5}
整数型の配列: array4 ← {111, 2, 3, 4, 5}
整数型の配列: array5 ← {1, 22, 333, 4444, 55555}

funcA(200)

〇funcA(整数型: paramA)
  整数型: a ← paramA
  整数型の配列: array2 ← {1, 2, 3, 4, 5}
  funcB(300)
  return

〇funcB(整数型: paramB)
  整数型: b ← paramB                    
  整数型の配列: array3 ← {1, 2, 3, 4, 5}    
  return
`,

// [14] 変数に戻り値、　宣言と同時に戻り値 (仕様変更したのでもう一度確認)
`
整数型: x
x ← funcA()

整数型: y ← funcB()

〇整数型: funcA()
  整数型: a ← 100
  return a
 
〇funcB()
  整数型: b ← 200                        
  return b

`

  ];

  // const NUMBER = 13; // プログラム選択
  // const problemCode = problems[NUMBER];
  const problemCode = problems[selectedProblemIndex];

  // 予定

  // 配列の指定した要素番号への代入が未実装                                                完了
  // 複数の変数を同時に宣言が未実装                                                       完了
  // if文に入った後、ifを抜けた時にelifを一度解析するのが気持ち悪いからスキップ処理を入れる？
  // 宣言した変数に、関数の返り値を入れるが未実装                                           完了
  // 配列表示のために変数、配列を分ける判定が必要？                                         完了

  // コメントアウトの色を変える
  // Ace Editorの言語設定(色)
  // 画面全体の表示サイズの自動変更(縦方向)
  // エディタ上のコードの変更は残したまま、変数などのステートのみをリセットするボタン          完了
  // 最後まで実行するボタン                                                               完了
  // タブ切り替え(問題解答機能)
  // ブレークポイント

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* 左側 Editor*/}
      {/* problemCode (エディタに載せるコード) */}
      {/* setResult に setglobalVars関数 を入れて渡す(EditorPanelで globalVars を更新できる) */}
      <EditorPanel problemCode={problemCode} setResult={setglobalVars} globalVars={globalVars} setOutput={setOutput} output={output} 
      setcallStack={setcallStack} callStack={callStack}/>

      {/* 右側：上に変数一覧、下に出力*/}
      <div
        style={{
          flex: '1 1 50%',         // エディタとの横幅
          display: 'flex',
          flexDirection: 'column', // 縦並び
          gap: '1rem',  
        }}>
        {/* 変数一覧に載せる、globalVars, callStack(local変数が入ってる)を渡す */}
        <div style={{height: 380}}>
          <VariablesPanel globalVars={globalVars} callStack={callStack}/>
        </div>
        <div style={{height: 180}}>
          <OutputPanel output={output} />
        </div>
      </div>
    </div>
  );
}
