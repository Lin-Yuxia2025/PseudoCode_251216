import React from 'react';

function VariablesPanel({ globalVars, callStack }) {
  // グローバルを [name, variable] の配列に
  const globalentries = Object.entries(globalVars);

  // ローカルを関数ごとにまとめた形に変換
  const nameCount = {};
  const localentries = callStack.map((frame) => {
    const funcName = frame.funcName;
    nameCount[funcName] = (nameCount[funcName] || 0) + 1;
    const displayName =
      nameCount[funcName] > 1 ? `${funcName} (${nameCount[funcName]}回目)` : funcName;

    return {
      name: displayName,
      variables: Object.entries(frame.variables),
    };
  });

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

  // 変数名ヘッダ部分
  const varNameStyle = {
    padding: '0.3rem 0.4rem',
    fontWeight: 'bold',
    textAlign: 'center',
    background: '#f0f0f0',
    borderBottom: '1px solid #ccc',
    fontSize: '0.8rem',
  };

  // 値領域（中にスカラ or 配列ミニ表）
  const varValueStyle = {
    padding: '0.35rem 0.4rem',
    textAlign: 'center',
    wordBreak: 'break-all',
  };

  // スカラ用描画
  const renderScalarBox = (name, variable) => {
    const value = variable.value;

    return (
      <div key={name} style={varBoxStyle}>
        <div style={varNameStyle}>{name}</div>
        <div style={{ ...varValueStyle, color: '#1C00CF', fontWeight: 'bold' }}>
          {String(value)}
        </div>
      </div>
    );
  };

  // 配列用描画（セル幅は要素数で均等割り、ボックス幅も要素数で決定）
  const renderArrayBox = (name, variable) => {
    const arr = Array.isArray(variable.value) ? variable.value : [];
    const count = arr.length || 1;             // 0 で割らない保険

    // 要素数に応じてボックス幅を変える（内容の長さは関係なし）
    const cellBaseWidth = 40;                  // 「要素1つあたりこれくらいの幅で表示」
    const boxWidth = Math.max(110, count * cellBaseWidth);

    const arrayBoxStyle = {
      ...varBoxStyle,
      width: boxWidth,
    };

    const tableStyle = {
      width: '100%',
      borderCollapse: 'collapse',   // 境界線を重ねる
      tableLayout: 'fixed',         // 内容ではなくセル幅でレイアウト決定
    };

    // 全セル共通: 要素数で均等割り & 内容で伸びない
    const baseCellStyle = {
      border: '1px solid #777',
      padding: '2px 4px',
      fontSize: '0.8rem',
      textAlign: 'center',
      width: `${100 / count}%`,     // 要素数で均等割り
      overflow: 'hidden',
      textOverflow: 'ellipsis',     // はみ出したら … でカット
      whiteSpace: 'nowrap',         // 折り返さない
    };

    const indexCellStyle = {
      ...baseCellStyle,
      fontWeight: 'bold',
      background: '#f0f0f0',
      color: '#555',
    };

    const valueCellStyle = {
      ...baseCellStyle,
      fontWeight: 'bold',
      color: '#1C00CF',             // エディタの数字と同じ色
    };

    return (
      <div key={name} style={arrayBoxStyle}>
        <div style={varNameStyle}>{name}</div>
        <div style={varValueStyle}>
          <table style={tableStyle}>
            <tbody>
              {/* 1行目: 要素番号 */}
              <tr>
                {arr.map((_, idx) => (
                  <td key={`i-${idx}`} style={indexCellStyle}>
                    {idx + 1}
                  </td>
                ))}
              </tr>
              {/* 2行目: 値 */}
              <tr>
                {arr.map((v, idx) => (
                  <td key={`v-${idx}`} style={valueCellStyle}>
                    {String(v)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
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
