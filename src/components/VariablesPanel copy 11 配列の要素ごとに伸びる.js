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

  // 配列用ボックス（横に長くしておく）
  const arrayBoxStyle = {
    ...varBoxStyle,
    width: 'auto',
    minWidth: 200,     // 配列表示用なので少し広め
    maxWidth: '100%',  // パネルの幅までは広がってOK
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

  // 配列用描画
  const renderArrayBox = (name, variable) => {
    const arr = Array.isArray(variable.value) ? variable.value : [];

    const tableStyle = {
      width: '100%',
      borderCollapse: 'collapse',  // 境界線を重ねる
      tableLayout: 'auto',         // コンテンツに合わせてセル幅決定
    };

    const indexCellStyle = {
      border: '1px solid #777',
      padding: '2px 4px',
      fontSize: '0.8rem',
      textAlign: 'center',
      fontWeight: 'bold',
      background: '#f0f0f0',
      color: '#555',
      whiteSpace: 'nowrap',        // 折り返さない
    };

    const valueCellStyle = {
      border: '1px solid #777',
      padding: '2px 4px',
      fontSize: '0.8rem',
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#1C00CF',           // エディタの数字と同じ色
      whiteSpace: 'nowrap',       // 折り返さない
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
