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
  // [インデックス] {プログラム名, 備考, コード}
  const problems = [
    // [0]  サンプル問題1 
    ["サンプル問題1",
      "変数の代入",
`整数型: x ← 1
整数型: y ← 2
整数型: z ← 3
x ← y
y ← z
z ← x
y を 出力する
z を 出力する`
    ],

    // [1]  関数呼び出し(引数有り) & コメントアウト
    ["関数呼び出しテスト(引数有り)",
      "コメントアウトテスト",
`funcA(100)
// コメントアウトテスト1
〇funcA(整数型: paramA)
  整数型: x ← 1                         // コメントアウトテスト2
  x ← paramA
  x を 出力する

  return
`
    ],

    // [2]  配列
    ["配列",
      "テスト",
`整数型の配列: problemArray ← {3, 2, 1, 6, 5, 4}  // 出題用のグローバル変数
makeNewArray(problemArray)

〇makeNewArray(整数型の配列: in)
  整数型の配列: out ← {}  // 要素数0の配列
  整数型: i
  整数型: tail
  outの末尾にin[1]の値を追加する
  return`
    ],

    // [3] スライド用
    ["スライド用",
      "",
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
  
  return`
    ],
      
    // [4] 関数内で関数呼び出し 一旦仮引数は無視
    ["関数内で関数呼び出し",
      "テスト",
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

  return`
    ],

    // [5] 関数の返り値を代入
    ["関数の返り値を代入",
      "テスト",
`整数型: x
x ← funcA()

〇funcA()
  整数型: y ← 1
  
  return y`
    ],

    // [6] if文
    ["if文",
      "テスト",
`整数型: result
result ← factorial(5)

〇整数型: factorial(整数型: n)
  整数型:f
  if(n = 0)    
    return 1
  endif 
  f ← factorial(n-1) 
  return n × f`
    ],

    // [7] for文
    ["for文",
      "テスト",
`func()

〇func()
  整数型: i
  for(i を 1 から 5 まで 1 ずつ増やす)
    i を 出力する
  endfor
`
    ],

// [8] サンプル問題3 (配列の要素までの値を足したものをそれぞれ、新しい配列の要素として返す)
    ["サンプル問題3",
      "配列の要素までの値を足す",
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
`
    ],

// [9] while文
    ["while文",
      "テスト",
`整数型:a ← 1

while (a < 5)
  a を出力する
  a ← a + 1
endwhile

`
    ],

    // [10] サンプル問題13 targetが配列の何番にあるかを探す (無限ループになってしまうプログラム)
    ["サンプル問題13",
      "targetが配列にあるかを探す(無限ループバグ)",
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
`
    ],

// [11] do whileテスト
    ["do while",
      "テスト",
`整数型: i ← 0
do  
  i ← i + 1
while(i < 3)

`
    ],

// [12] while do while ネスト 
    ["while, do_while ネスト",
      "テスト",
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

`
    ],

    // [13] 変数表示テスト
    ["変数,配列表示",
      "テスト",
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
`
    ],

// [14] 変数に戻り値、　宣言と同時に戻り値 (仕様変更したのでもう一度確認)
    ["変数に戻り値、宣言と同時に戻り値",
      "",
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
    ],
  ];

  const selectedProblem = problems[selectedProblemIndex];

  // const problemTitle = selectedProblem[0];
  // const problemMemo  = selectedProblem[1];
  const problemCode  = selectedProblem[2];

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
  // プログラムリストを多次元配列にして、プログラム名、補足などを入れてメニュー選択時に表示させる？
  // ４つ目の要素に問題文を入れる？

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* 左側 Editor*/}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 50%' }}>  
        {/* プログラム選択プルダウン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="problem-select" style={{ fontSize: '0.85rem' }}>
            プログラム選択：
          </label>
          <select
            value={selectedProblemIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedProblemIndex(idx);
            }}
          >
            {problems.map(([title, memo], idx) => (
              <option key={idx} value={idx}>
                {`[${idx}] ${title} - ${memo}`}
              </option>
            ))}
          </select>
        </div>
        {/* problemCode (エディタに載せるコード) */}
        {/* setResult に setglobalVars関数 を入れて渡す(EditorPanelで globalVars を更新できる) */}
        <EditorPanel problemCode={problemCode} setResult={setglobalVars} globalVars={globalVars} setOutput={setOutput} output={output} 
        setcallStack={setcallStack} callStack={callStack}/>
      </div>

      {/* 右側：上に変数一覧、下に出力*/}
      <div
        style={{
          flex: '1 1 50%',         // エディタとの横幅
          display: 'flex',
          flexDirection: 'column', // 縦並び
          gap: '1.5rem',  
        }}>
        {/* 変数一覧に載せる、globalVars, callStack(local変数が入ってる)を渡す */}
        <div style={{height: 380}}>
          <VariablesPanel globalVars={globalVars} callStack={callStack}/>
        </div>
        <div style={{height: 160}}>
          <OutputPanel output={output} />
        </div>
      </div>
    </div>
  );
}
