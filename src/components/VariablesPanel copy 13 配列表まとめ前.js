import React from 'react';

// indexから渡された globalVars, callStack を分割代入
function VariablesPanel({ globalVars, callStack }) {
  // globalVars, localvarsからループ処理できる形に変換
  // Object.entries()  key-valueペアを[key, value]形式の配列に変換し、それらを含む配列を返す

  // grobal 
  // グローバルを [name, variable] の配列に
  const globalentries = Object.entries(globalVars);

  // local
  // ローカルを関数ごとにまとめた形に変換
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
  };


  // css

  // 共通ボックスデザイン（スカラ用）
  const varBoxStyle = {
    width: 110,
    border: '1px solid #ccc',
    borderRadius: 6,
    marginRight: '0.4rem',
    marginBottom: '0.4rem',
    background: 'white',
    overflow: 'hidden', // 角からはみ出さないように
    fontSize: '0.8rem',
  };

  // 変数名部分
  const varNameStyle = {
    padding: '0.3rem 0.4rem',
    fontWeight: 'bold',
    textAlign: 'center',
    background: '#f0f0f0',
    borderBottom: '1px solid #ccc',
    fontSize: '0.8rem',
  };

  // 値部分（中にスカラ or 配列）
  const varValueStyle = {
    padding: '0.35rem 0.4rem',
    textAlign: 'center',
    wordBreak: 'break-all',         // 収まらなかったら改行
    color: '#1C00CF',
    fontWeight: 'bold',
  };

  // 表示用関数

  // スカラ
  const renderScalarBox = (name, variable) => {
    const value = variable.value;

    return (
      <div key={name} style={varBoxStyle}>
        <div style={varNameStyle}>{name}</div>
        <div style={varValueStyle}>{String(value)}</div>
      </div>
    );
  };

  // 配列
  const renderArrayBox = (name, variable) => {
    const arr_val = variable.value;

    // 配列のボックスは中身の幅に合わせて伸びるようにする
    const arrayBoxStyle = {
      ...varBoxStyle,
      width: 'auto',            // 固定幅をやめて伸びるように
      minWidth: 0,              // 最小制限なし
      display: 'inline-block',  // 横並び、幅指定
    };

    // tableの一つ上
    const tableWrapperStyle = {
      display: 'flex',
      justifyContent: 'center', // 子要素を中央寄せ
    };

    // 配列表
    const arrayTableStyle = {
      borderCollapse: 'collapse', // 境界線を重ねる
      margin: '0 auto',           // 念のため中央寄せ
    };

    // セル幅は内容に任せる（width 指定なし）
    const baseCellStyle = {
      border: '1px solid #777',
      padding: '2px 4px',
      fontWeight: 'bold',
      fontSize: '0.8rem',
      textAlign: 'center',
      whiteSpace: 'nowrap', // 折り返さず横に伸びる
    };

    // 要素番号
    const indexCellStyle = {
      ...baseCellStyle,
      background: '#f0f0f0',
      color: '#555',
    };

    // 要素(値)
    const valueCellStyle = {
      ...baseCellStyle,
      color: '#1C00CF', // エディタの数値と同じ色
    };

    // 配列時は余白を少しだけにして、空白を減らす
    const arrayValueWrapperStyle = {
      ...varValueStyle,
      padding: '0.2rem 0.2rem',
    };


    return (
      <div key={name} style={arrayBoxStyle}>
        <div style={varNameStyle}>{name}</div>
        <div style={arrayValueWrapperStyle}>
          <div style={tableWrapperStyle}>
            <table style={arrayTableStyle}>
              {/* 配列表 */}
              {/* arr_valにmapメソッドを使い、各値を埋め込み表示  */}
              <tbody>
                {/* 1行目: 要素番号 */}
                <tr>
                  {arr_val.map((val, idx) => (
                    <td key={idx} style={indexCellStyle}>
                      {/* 疑似言語なので要素番号は +1 で表示 */}
                      {idx + 1}
                    </td>
                  ))}
                </tr>
                {/* 2行目: 値 */}
                <tr>
                  {arr_val.map((val, idx) => (
                    <td key={idx} style={valueCellStyle}>
                      {String(val)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 1スコープ（global or 各関数）の中で
  // 「スカラだけの行」と「配列だけの行」に分けて描画するヘルパー
  const renderScopeVars = (entries) => {
    const scalarVars = entries.filter(([, variable]) => variable.kind !== 'array');
    const arrayVars = entries.filter(([, variable]) => variable.kind === 'array');

    return (
      <>
        {/* スカラ行 */}
        {scalarVars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {scalarVars.map(([name, variable]) => renderScalarBox(name, variable))}
          </div>
        )}

        {/* 配列行（スカラの下） */}
        {arrayVars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {arrayVars.map(([name, variable]) => renderArrayBox(name, variable))}
          </div>
        )}
      </>
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
      {globalentries.length > 0 && (
        <>
          <h4>グローバル変数</h4>
          {renderScopeVars(globalentries)}
        </>
      )}

      {/* ローカル変数（関数ごと） */}
      {localentries.map((local, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <h4>{local.name}</h4>
          {renderScopeVars(local.variables)}
        </div>
      ))}
    </div>
  );
}

export default VariablesPanel;
