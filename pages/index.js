import React, { useState, useEffect } from 'react';
import EditorPanel from '../components/EditorPanel';
import VariablesPanel from '../components/VariablesPanel';
import OutputPanel from '../components/OutputPanel';


export default function Home() {
  const [globalVars, setglobalVars] = useState({});
  const [output, setOutput] = useState({});
  const [callStack, setcallStack] = useState([]);                         // 関数が呼び出されるたびにステートを重ねる
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);    // プログラム選択
  const [insertChoiceNumber, setinsertChoiceNumber] = useState(null);     // 選択肢から挿入する際の選択番号
  const [insertChoicedata, setinsertChoicedata] = useState(null);         // エディタに送る、置き換え内容

  // エディタの初期コードリスト
  // [インデックス] {プログラム名, 備考, コード, 問題文, 一行に選択肢を何個置くか, 選択肢から挿入する内容}
  const problems = [
    // ★ サンプル問題1 
    ["サンプル問題1",
      "変数の代入",
`整数型: x ← 1
整数型: y ← 2
整数型: z ← 3
x ← y
y ← z
z ← x
y を 出力する
z を 出力する`,

// 問題文
`このプログラムを実行すると整数値が2回出力される。
実行した際に出力されるものが、出力される順に並んだものを
解答群の中から選んでください。`,

      // 解答群
      [
        { id: "ア", text: "1,2", answer: "incorrect" },
        { id: "イ", text: "1,3", answer: "incorrect" },
        { id: "ウ", text: "2,1", answer: "incorrect" },
        { id: "エ", text: "2,3", answer: "incorrect" },
        { id: "オ", text: "3,1", answer: "incorrect" },
        { id: "カ", text: "3,2", answer: "correct" },
      ],
      // 1行に何個置くか
      3
    ],

    // ★ サンプル問題3 (配列の要素までの値を足したものをそれぞれ、新しい配列の要素として返す)
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
`,

      // 問題文
`次の記述中の 【空欄】 に入れる正しい答えを、解答群の中から選んでください。また、配列の要素番号は 1 から始まります。

関数 makeNewArrayは、要素数2以上の整数型の配列を引数にとり、整数型の配列を返す関数である。
関数 makeNewArrayを makeNewArray(array) として呼び出した時、戻り値の配列の要素番号5の値は 【空欄】 となる。
`,

      // 解答群
      [
        { id: "ア", text: "5", answer: "incorrect" },
        { id: "イ", text: "6", answer: "incorrect" },
        { id: "ウ", text: "9", answer: "incorrect" },
        { id: "エ", text: "11", answer: "incorrect" },
        { id: "オ", text: "12", answer: "incorrect" },
        { id: "カ", text: "17", answer: "correct" },
        { id: "キ", text: "21", answer: "incorrect" },
      ]
    ],


    // ★ サンプル問題4 最大公約数を求める
    ["サンプル問題4",
      "最大公約数",
`整数型: result ← gcd(36, 60)
resultを出力する

〇整数型: gcd(整数型: num1, 整数型: num2)
  整数型: x ← num1
  整数型: y ← num2
  A                                             // 空欄A
    if ( B )                                    // 空欄B
      x ← x - y
    else
      y ← y - x
    endif
  C                                             // 空欄C
  return x
`,

// 問題文
`次のプログラム中のA, B, Cに入れる正しい答えの組み合わせを、解答群の中から選んでください。

関数 gcd は、引数で与えられた二つの正の整数 num1 と num2 の最大公約数を、次の(1)~(3)の性質を利用して求める。
(1) num1 と num2 が等しい時、num1 と num2 の最大公約数は num1 である。
(2) num1 が num2 より大きい時、num1 と num2 の最大公約数は、(num1 - num2)と num2 の最大公約数と等しい。
(3) num2 が num1 より大きい時、num1 と num2 最大公約数は、(num2 - num1) とnum1 の最大公約数と等しい。 

`,

      // 解答群
      [
        { id: "ア", text: "A: \u00A0 if (x ≠ y) \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 x < y \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 C: \u00A0 endif", answer: "incorrect" },
        { id: "イ", text: "A: \u00A0 if (x ≠ y) \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 x > y \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 C: \u00A0 endif", answer: "incorrect" },
        { id: "ウ", text: "A: \u00A0 while (x ≠ y) \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 x < y \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 C: \u00A0 endwhile", answer: "incorrect" },
        { id: "エ", text: "A: \u00A0 while (x ≠ y) \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 x > y \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 C: \u00A0 endwhile", answer: "correct" },
      ],
      // 1行に何個置くか
      1,
      // 選択肢から入力するための情報[選択肢番号][{内容, 行番号}]
      [
        // ア
        [
          { text: "  if (x ≠ y)", line: 6},
          { text: "    if ( x < y )", line: 7},
          { text: "  endif", line: 12},
        ],        
        // イ
                [
          { text: "  if (x ≠ y)", line: 6},
          { text: "    if ( x > y )", line: 7},
          { text: "  endif", line: 12},
        ],
        // ウ
                [
          { text: "  while (x ≠ y)", line: 6},
          { text: "    if ( x < y )", line: 7},
          { text: "  endwhile", line: 12},
        ],
        // エ
                [
          { text: "  while (x ≠ y)", line: 6},
          { text: "    if ( x > y )", line: 7},
          { text: "  endwhile", line: 12},
        ],
      ]
    ],

    // ★ サンプル問題7 再帰関数（階乗）
    ["サンプル問題7",
      "再帰関数(階乗)",
`整数型: result
result ← factorial(5)
resultを出力する

〇整数型: factorial(整数型: n)
  整数型:f
  if(n = 0)    
    return 1
  endif 
  f ← factorial(A)                  // 空欄A
  return B                          // 空欄B
`,

// 問題文
`次のプログラム中の空欄A, Bに入れる正しい答えを、解答群の中から選べ。

関数 factorial は非負の整数 n を引数にとり、その階乗を返す関数である。
非負の整数 n の階乗は n が0のときに1になり、
それ以外の場合は1から n までの整数を全て掛け合わせた数となる。`,

      // 解答群
      [
        { id: "ア", text: "A: \u00A0 n \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 f \u00A0\u00A0\u00A0\u00A0\u00A0",  answer: "incorrect" },
        { id: "イ", text: "A: \u00A0 n \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 n × f",  answer: "incorrect" },
        { id: "ウ", text: "A: \u00A0 n - 1 \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 f \u00A0\u00A0\u00A0\u00A0\u00A0",  answer: "incorrect" },
        { id: "エ", text: "A: \u00A0 n - 1 \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 B: \u00A0 n × f",  answer: "correct" },
      ],
      // 1行に何個置くか
      1,
      // 選択肢から入力するための情報[選択肢番号][{内容, 行番号}]
      [
        // ア
        [
          { text: "  f ← factorial(n)", line: 9},
          { text: "  return f", line: 10},
        ],        
        // イ
                [
          { text: "  f ← factorial(n)", line: 9},
          { text: "  return n × f", line: 10},
        ],
        // ウ
                [
          { text: "  f ← factorial(n-1)", line: 9},
          { text: "  return f", line: 10},
        ],
        // エ
                [
          { text: "  f ← factorial(n-1)", line: 9},
          { text: "  return n × f", line: 10},
        ],
      ]
    ],


    // ★　サンプル問題13 targetが配列の何番にあるかを探す (無限ループになってしまうプログラム)
    ["サンプル問題13",
      "targetが配列にあるかを探す(無限ループバグ)",
`整数型の配列: array ← {1,2}
整数型: result
result ← search(array, 2)

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

  // 問題文
`次の記述中の【空欄】に入れる正しい答えを、解答群の中から選んでください。ここで、配列の要素番号は 1 から始まるとします。

関数 search は、引数 data で指定された配列に、引数 target で指定された値が含まれていればその要素番号を返し、
含まれていなければ -1 を返す。 data は昇順に整列されており、値に重複はない。
関数 search には不具合がある。例えば、 data の 【空欄】 場合は、無限ループになる。`,

      // 解答群
      [
        { id: "ア", text: "要素数が 1 で、target がその要素の値と等しい", answer: "incorrect" },
        { id: "イ", text: "要素数が 2 で、target が data の先頭要素と等しい", answer: "incorrect" },
        { id: "ウ", text: "要素数が 2 で、target が data の末尾要素の値と等しい", answer: "correct" },
        { id: "エ", text: "要素に -1 が含まれている", answer: "incorrect" },
      ],
      // 1行に何個置くか
      1
    ],


    // ★ 関数呼び出し(引数有り) & コメントアウト
    ["関数呼び出しテスト(引数有り)",
      "コメントアウトテスト",
`funcA(100)
// コメントアウトテスト1
〇funcA(整数型: paramA)
  整数型: x ← 1                         // コメントアウトテスト2
  x ← paramA
  x を 出力する

  return
`,
    //問題文
    ""

    ],


    // ★ 配列
    ["配列",
      "テスト",
`整数型の配列: problemArray ← {3, 2, 1, 6, 5, 4}  // 出題用のグローバル変数
makeNewArray(problemArray)

〇makeNewArray(整数型の配列: in)
  整数型の配列: out ← {}  // 要素数0の配列
  整数型: i
  整数型: tail
  outの末尾にin[1]の値を追加する
  return`,

    // 問題文
    ""

    ],

    

    // ★ スライド用
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
  
  return`,

  // 問題文
  ""
    ],
      
    // ★ 関数内で関数呼び出し 一旦仮引数は無視
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

  return`,

  // 問題文
  ""
    ],

    // ★ 関数の返り値を代入
    ["関数の返り値を代入",
      "テスト",
`整数型: x
x ← funcA()

〇funcA()
  整数型: y ← 1
  
  return y`,

  // 問題文
  ""

    ],

    // ★ if文
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
  return n × f`,

  // 問題文
  ""
    ],

    // ★　for文
    ["for文",
      "テスト",
`func()

〇func()
  整数型: i
  for(i を 1 から 5 まで 1 ずつ増やす)
    i を 出力する
  endfor
`,

      // 問題文
      ""
    ],

    // ★ while文
    ["while文",
      "テスト",
`整数型:a ← 1

while (a < 5)
  a を出力する
  a ← a + 1
endwhile

`,

      // 問題文
      ""
    ],


// ★ do whileテスト
    ["do while",
      "テスト",
`整数型: i ← 0
do  
  i ← i + 1
while(i < 3)

`,

      // 問題文
      ""
    ],

// ★ while do while ネスト 
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

`,

      // 問題文
      ""
    ],

    // ★ 変数表示テスト
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
`,

      // 問題文
      ""
    ],

// ★ 変数に戻り値、　宣言と同時に戻り値 (仕様変更したのでもう一度確認)
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

`,

      // 問題文
      ""
    ],

    
  ];

  const selectedProblem = problems[selectedProblemIndex];

  // const problemTitle = selectedProblem[0];
  // const problemMemo  = selectedProblem[1];
  const problemCode  = selectedProblem[2];
  const problemText = selectedProblem[3];                 // 問題文
  const answerChoices = selectedProblem[4] || [];         // 解答群 (無ければ空配列)
  const choiceitemsRow = selectedProblem[5] || 3;         // 一行に選択肢を何個置くか (なければデフォルト3個
  const insertChoiceList = selectedProblem[6] || [];      // 選択肢から挿入する内容のリスト [ア, イ, ウ]（無ければ空配列）
  

  // 選択肢から挿入ボタンが押されたら、内容を押された番号の内容を取得して、エディタに渡す
  useEffect(() => {
    if (insertChoiceNumber == null)
      return 
    // const insertChoiceList = selectedProblem[6] || [];            // 選択肢から挿入する内容（無ければ空配列）
    setinsertChoicedata(insertChoiceList[insertChoiceNumber]);       // 押された番号の置き換え内容を取得 [{text, line}, {text, line},]
  }, [insertChoiceNumber]);



  // 予定

  // 配列の指定した要素番号への代入が未実装                                                完了
  // 複数の変数を同時に宣言が未実装                                                       完了
  // 宣言した変数に、関数の返り値を入れるが未実装                                           完了
  // 配列表示のために変数、配列を分ける判定が必要？                                         完了

  // エディタ上のコードの変更は残したまま、変数などのステートのみをリセットするボタン          完了
  // 最後まで実行するボタン                                                               完了
  // タブ切り替え(問題解答機能)                                                           完了                                                                                         
  // プログラムリストを多次元配列にして、プログラム名、補足などを入れてメニュー選択時に表示させる？   完了
  // ４つ目の要素に問題文を入れる                                                          完了
  // 問題文を表示と選択肢ボタンを明るくする？                                               完了
  // 問題文の"空欄"表示方法                                                               完了
  // 一行に選択肢を何個置くかを決める値をリストに持たせる？                                  完了

  // 選択肢からボタンで空欄に入力する機能を実装、あるいは入力が要らないように問題を改変する？     完了
  // 差し替え内容をリストにして、登録しておけば、ボタンから入力できる？　　　　[選択肢の番号][{内容, 行番号}]     完了
  // 変数パネルからエディターに送る必要がある（setを変数パネルに渡して、エディターにはステートを渡す？            完了
  // 渡されたら、エディター側で差し替える？                                                                  完了
  // 変数パネルからは挿入する選択肢の番号だけをindexに返す→indexから番号のオブジェクトをエディタに送る           完了
  // プログラムを変更したとき（selectedProblemが変更）したときにinsertChoiceNumberも初期化処理をいれる         完了
  // リセットのためにエディタにもsetを送らないといけない                                                      完了
  // insertChoiceListを変数パネルに渡して、置き換えボタンを表示するかの判定に使う                              完了

  // ブレークポイント
  //  {} で配列の値として扱うルール
  // 全ての行を実行などのメッセージも解答結果などと統一する？                                                 完了
  // エラーメッセージにカレントラインも表示する                                                              完了

  // エラー落ち全般                                                                                        字句、構文解析エラーには対応
  // 全て実行後、無限ループに入ったら止めてメッセージを出す                                                   完了
  // 解答後に解説？
  // "="で代入など疑似言語ではない構文を使えるようにする
  // コメントアウトの色を変える
  // Ace Editorの言語設定(色)
  // 画面全体の表示サイズの自動調整(縦方向)
  // if文に入った後、ifを抜けた時にelifを一度解析するのが気持ち悪いからスキップ処理を入れる？
  // n × (n-1) の様な時に、(n-1)をvalueとして扱う必要がある     (valueを後から()で包んでもvalueとして扱えるようにする？)

  // 関数の戻り値をreturnできるようにする

  // 関数の戻り値を使う処理の前に、乗算などの処理があれば実行して値を作ってから、戻り値を使うようにする？
  // 戻り値との演算に使う変数の値は、呼び出した時と変わらないはずだから、呼び出した時点で数値として登録できる？
  // つまり、記号と、数値の２つを登録すればいい？



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
            value={selectedProblemIndex}            // 選択の反映
            onChange={(e) => {
              const idx = Number(e.target.value);   // 選んだindexを数値に変換して取得
              setSelectedProblemIndex(idx);         
            }}
          >
            {/* プログラムの[タイトル, 備考] , 番号でマッピング */}
            {problems.map(([title, memo], idx) => (
              <option key={idx} value={idx}>
                {/* [0] タイトル - 備考 */}
                {`[${idx}] ${title} - ${memo}`}
              </option>
            ))}
          </select>
        </div>
        {/* problemCode (エディタに載せるコード) */}
        {/* setResult に setglobalVars関数 を入れて渡す(EditorPanelで globalVars を更新できる) */}
        <EditorPanel problemCode={problemCode} setResult={setglobalVars} globalVars={globalVars} setOutput={setOutput} output={output} 
        setcallStack={setcallStack} callStack={callStack} insertChoicedata={insertChoicedata} setinsertChoicedata={setinsertChoicedata} setinsertChoiceNumber={setinsertChoiceNumber}/>
      </div>

      {/* 右側：上に変数一覧、下に出力*/}
      <div
        style={{
          flex: '1 1 50%',         // エディタとの横幅
          display: 'flex',
          flexDirection: 'column', // 縦並び
          gap: '3.0rem',  
        }}>
        {/* 変数一覧に載せる、globalVars, callStack(local変数が入ってる)を渡す */}
        <div style={{height: 380}}>
          <VariablesPanel globalVars={globalVars} callStack={callStack} problemText={problemText}
           answerChoices={answerChoices} choiceitemsRow={choiceitemsRow} setinsertChoiceNumber={setinsertChoiceNumber} insertChoiceList={insertChoiceList}/>
        </div>
        <div style={{height: 140}}>
          <OutputPanel output={output} />
        </div>
      </div>
    </div>
  );
}
