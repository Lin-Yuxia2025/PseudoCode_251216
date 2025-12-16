import React, { useState } from 'react';

// indexから渡された globalVars, callStack を分割代入
function VariablesPanel({ globalVars, callStack }) {
  // ▼ タブ状態（変数 or 問題文）
  const [activeTab, setActiveTab] = useState('variables'); // 'variables' | 'problem'

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

  // ▼ タブ周りのスタイル（ラジオボタン風）
  const tabWrapperStyle = {
    display: 'inline-flex',
    // borderRadius: 9999,
    borderRadius: '0 0 10px 10px',  // 上左右は0、下だけ丸く
    padding: '2px',
    background: '#e5e5e5',
  };

  const tabButtonBase = {
    border: 'none',
    // borderRadius: 9999,
    // borderRadius: '0 0 5000px 15000px',  // 上左右は0、下だけ丸く
    padding: '0.3rem 0.8rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

  // 左タブ専用（左下だけ丸める）
  const tabButtonLeft = {
    borderRadius: '0 0 10px 10px',
  };

  // 右タブ専用（右下だけ丸める）
  const tabButtonRight = {
    borderRadius: '0 0 10px 10px',
  };


  const tabButtonActive = {
    ...tabButtonBase,
    background: '#ffffff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    fontWeight: 'bold',
  };

  const tabButtonInactive = {
    ...tabButtonBase,
    color: '#555',
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
      background: '#e5dedeff',
      color: '#111',
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

  // 呼び出したスコープ（global or 各local）の中でスカラだけの行 と 配列だけの行 に分けて
  // (renderBOX)を呼びだし、表示内容を返す
  const renderScopeVars = (entries) => {
    // variable(value, kind)からスカラだけのリスト、配列だけのリストを取り出す
    const scalarVars = entries.filter(([, variable]) => variable.kind !== 'array');
    const arrayVars = entries.filter(([, variable]) => variable.kind === 'array');

    return (
      <>
        {/* スカラ行 */}
        {scalarVars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {/* スカラのリストから各変数でrenderBOXを呼び出して埋め込み */}
            {/* name, variableを分割代入してから使う */}
            {scalarVars.map(([name, variable]) => renderScalarBox(name, variable))}
          </div>
        )}

        {/* 配列行（スカラの下） */}
        {arrayVars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {/* 配列のリストから各配列でrenderBOXを呼び出して埋め込み */}
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
        padding: '0.6rem 0.8rem 1.4rem 0.8rem', // ★ 下を少し広めに
        background: '#fafafa',
        height: 360,
        overflow: 'visible',                     // ★ はみ出しOKに
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',                    // ★ 絶対配置の基準
      }}
    >
      {/* 中身：変数一覧 or 問題文（領域を最大限使う） */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'variables' && (
          <>
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
          </>
        )}

        {activeTab === 'problem' && (
          <div style={{ padding: '0.5rem 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
            問題文
          </div>
        )}
      </div>

      {/* 右下に“生えている”タブ切り替えボタン */}
      <div
        style={{
          position: 'absolute',
          right: '0.8rem',
          bottom: '-2rem', // ★ マイナスで外側にはみ出させる
        }}
      >
        <div style={tabWrapperStyle}>
          {/* 左タブ（変数） */}
          <button
            onClick={() => setActiveTab('variables')}
            style={
              activeTab === 'variables'
                ? { ...tabButtonActive, ...tabButtonLeft }
                : { ...tabButtonInactive, ...tabButtonLeft }
            }
          >
            変数・配列の表示
          </button>

          {/* 右タブ（問題文） */}
          <button
            onClick={() => setActiveTab('problem')}
            style={
              activeTab === 'problem'
                ? { ...tabButtonActive, ...tabButtonRight, }
                : { ...tabButtonInactive, ...tabButtonRight, }
            }
          >
            問題文を表示
          </button>
        </div>
      </div>
    </div>
  );
}

export default VariablesPanel;
