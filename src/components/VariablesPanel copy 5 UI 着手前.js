import React from 'react';

// 親(index)から渡された props 中の globalVars を分割代入 (直接使える)
function VariablesPanel({ globalVars, callStack }) {

  // 配列以外のみ、改行＆インデントを行う関数
  const formatValue = (value) => {
    if (Array.isArray(value)) {             // 配列なら
      return JSON.stringify(value);         // 配列はそのまま1行
    }
    return JSON.stringify(value, null, 2);  // 配列以外なら、改行＆インデント
  };

  // globalVars の中身をループ処理できる形に変換
  // Object.entries()  key-valueペアを[key, value]形式の配列に変換し、それらを含む配列を返す
  // global
  const globalentries = Object.entries(globalVars);
  // local
  const len = callStack.length;
  const nameCount = {};                                        // 関数名ごとの呼び出している回数を記録
  let displayName = "";                                        // 表示する関数名(回数)
  const localentries = [];
  for (let i = 0; i < len; i++) {
    // 関数名
    const funcName = callStack[i]["funcName"];                 // 関数名を取得
    if (nameCount[funcName] === undefined) {                   // まだカウントしていない関数名なら
      nameCount[funcName] = 1;
    } 
    else {
      nameCount[funcName]++;
    }
    
    displayName = funcName;
    if (nameCount[funcName] > 1){                              // ２回目以降なら回数表示
      displayName = `${funcName} (${nameCount[funcName]}回目)`;
    }

    localentries.push({
      name: displayName,                                       // 関数名
      variables: Object.entries(callStack[i]["variables"])     // 変数
    });
  }

  
  
  



  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#fafafa',
      height: 360,   
      overflow: 'auto',           // はみ出したらスクロール
      }}>  
        <h3>変数一覧</h3>
        <div>
          {/* グローバル変数が1件以上あるときだけ表示 */}
          {globalentries.length > 0 && (
            <h4>グローバル変数</h4>
          )}
          {/* mapメソッドで囲んで、配列の要素ごとにループ処理して埋め込み */}
          {/* global変数 の [キー, 値] を分割代入して、name と value に代入 */}
          {globalentries.map(([name, value]) => (
            // name : value
            <div key={name} style={{ display: 'flex', marginLeft: '1rem', marginBottom: '0.2rem'}}>
              <div style={{ flex: '0 0 120px', textAlign: 'center', fontWeight: 'bold' }}>
                {name}
              </div>
              <div style={{ flex: '0 0 30px', textAlign: 'center', fontWeight: 'bold' }}>
               : 
              </div>
              <div style={{ flex: '0 0 120px', textAlign: 'center', fontWeight: 'bold' }}>
                {formatValue(value)}  {/* formatValueを呼んで、(配列以外なら改行して)値を埋め込み */}
              </div>
            </div>
          ))}

          {/* callStackごとでループ */}
          {/* local[name, variables], index(関数のリスト番号)で分割代入 */}
          {localentries.map((local, i) => (
            <div key={i} style={{ marginBottom: '1rem' }}>
              <h4>{local.name}</h4>
              {/* local変数 の [キー, 値] を分割代入して、name と value に代入 */}
              {local.variables.map(([name, value]) => (
                // name : value
                <div key={name} style={{ display: 'flex', marginLeft: '1rem', marginBottom: '0.2rem'}}>
                  <div style={{ flex: '0 0 120px', textAlign: 'center', fontWeight: 'bold' }}>
                    {name}
                  </div>
                  <div style={{ flex: '0 0 30px', textAlign: 'center', fontWeight: 'bold' }}>
                    : 
                  </div>
                  <div style={{ flex: '0 0 120px', textAlign: 'center', fontWeight: 'bold' }}>
                    {formatValue(value)}  {/* formatValueを呼んで、(配列以外なら改行して)値を埋め込み */}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>     
    </div>
  );
}

export default VariablesPanel;
