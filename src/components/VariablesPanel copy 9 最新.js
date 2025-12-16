import React from 'react';

// 親(index)から渡された props 中の globalVars を分割代入 (直接使える)
function VariablesPanel({ globalVars, callStack }) {

  // 投げられた変数・配列から値をJSON形式にして返す関数   (表示方法が変えたから、現在はvalueを返すだけになっている)
  const formatValue = (variable) => {
    const value = variable.value
    return JSON.stringify(value);
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


  // 表のように表示
  const varBoxStyle = {
    width: 110,
    border: '1px solid #ccc',
    borderRadius: 6,
    padding: '0.3rem',
    marginRight: '0.3rem',
    marginBottom: '0.3rem',
    textAlign: 'center',
    background: 'white',
    overflow: 'hidden', // 角丸からはみ出さないように
  };

  // 変数名
  const varNameStyle = {
    padding: '0.3rem 0.4rem',
    fontWeight: 'bold',
    textAlign: 'center',
    background: '#f0f0f0',
    borderBottom: '1px solid #ccc',
    fontSize: '0.9rem'
  };

  // 値
  const varValueStyle = {
    padding: '0.35rem 0.4rem',
    textAlign: 'center',
    wordBreak: 'break-all'          // はみだすなら改行
  };


  // 変数ボックスの中身（共通）: 上に名前、下に値
  const renderVarBox = (name, variable) => {
    const isArray = variable.kind === 'array';
    const value = variable.value;

    return (
      <div key={name} style={varBoxStyle}>
        {/* 上：変数名セル */}
        <div style={varNameStyle}>{name}</div>

        {/* 下：値 or 配列ミニ表 */}
        <div style={varValueStyle}>
          {isArray ? (
            <>
              {/* 1段目：要素番号（横並び） */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  marginBottom: 2,
                }}
              >
                {value.map((_, idx) => (
                  <div
                    key={`idx-${idx}`}
                    style={{ fontSize: '0.7rem', color: '#555' }}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* 2段目：値（横並び） */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  fontWeight: 'bold',
                }}
              >
                {value.map((v, idx) => (
                  <div key={`val-${idx}`}>{String(v)}</div>
                ))}
              </div>
            </>
          ) : (
            // 通常の値
            <span>{String(value)}</span>
          )}
        </div>
      </div>
    );
  };

  
  
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '1rem',
        background: '#fafafa',
        height: 360,
        overflow: 'auto', // はみ出したらスクロール
      }}
    >
      <h3>変数一覧</h3>

      {/* グローバル変数 */}
      {/* グローバル変数が1件以上あるときだけ表示 */}
      {globalentries.length > 0 && <h4>グローバル変数</h4>}
      {/* wrap:親の幅に収まらなかったら折り返し */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {/* mapメソッドで、配列の要素ごとにループ処理して埋め込み */}
        {/* global変数 の [キー, 値(中にvalue,kind)] を分割代入して、name と variable に代入 */}
        {/* 埋め込み */}
        {globalentries.map(([name, variable]) => renderVarBox(name, variable))}
      </div>

      {/* ローカル変数 */}
      {/* callStackごとでループ */}
      {/* local[name, variables], index(関数のリスト番号)で分割代入 */}
      {localentries.map((local, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <h4>{local.name}</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* local変数 の [キー, 値(中にvalue,kind)] を分割代入して、name と variable に代入 */}
            {/* 埋め込み */}
            {local.variables.map(([name, variable]) => renderVarBox(name, variable))}
          </div>
        </div>
      ))}
    </div>
  );


}

export default VariablesPanel;
