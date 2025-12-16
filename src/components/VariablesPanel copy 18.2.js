import React, { useState } from 'react';

function VariablesPanel({ globalVars, callStack }) {
  const [activeTab, setActiveTab] = useState('variables'); // 'variables' | 'problem'

  // ===== ここは今までと同じ（グローバル/ローカルの準備） =====
  const globalentries = Object.entries(globalVars);

  const len = callStack.length;
  const nameCount = {};
  let displayName = '';
  const localentries = [];
  for (let i = 0; i < len; i++) {
    const funcName = callStack[i]['funcName'];
    if (nameCount[funcName] === undefined) {
      nameCount[funcName] = 1;
    } else {
      nameCount[funcName]++;
    }
    displayName = funcName;
    if (nameCount[funcName] > 1) {
      displayName = `${funcName} (${nameCount[funcName]}回目)`;
    }
    localentries.push({
      name: displayName,
      variables: Object.entries(callStack[i]['variables']),
    });
  }

  // ===== CSS =====
  const PANEL_BG = '#f7f9fc';
  const PANEL_BORDER = '#d0d7e2';

  const varBoxStyle = {
    width: 110,
    border: '1px solid #ccc',
    borderRadius: 6,
    marginRight: '0.4rem',
    marginBottom: '0.4rem',
    background: 'white',
    overflow: 'hidden',
    fontSize: '0.8rem',
  };

  const varNameStyle = {
    padding: '0.3rem 0.4rem',
    fontWeight: 'bold',
    textAlign: 'center',
    background: '#f0f0f0',
    borderBottom: '1px solid #ccc',
    fontSize: '0.8rem',
  };

  const varValueStyle = {
    padding: '0.35rem 0.4rem',
    textAlign: 'center',
    wordBreak: 'break-all',
    color: '#1C00CF',
    fontWeight: 'bold',
  };

  // ▼ タブ：kipure っぽく “フラットなチップ” に寄せる
  // ラッパーは枠線ナシ、背景透明。パネルの外側にちょいはみ出す。
  const tabWrapperStyle = {
    display: 'inline-flex',
    gap: '0.25rem',
    background: 'transparent',
  };

  const tabButtonBase = {
    borderRadius: 9999,
    padding: '0.25rem 0.7rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    transition: 'all 0.12s ease',
    whiteSpace: 'nowrap',
  };

  // アクティブタブ → パネルと同じ色で「面」が繋がるイメージ
  const tabButtonActive = {
    ...tabButtonBase,
    background: PANEL_BG,          // ★ パネルと同色
    fontWeight: 'bold',
    color: '#333',
    boxShadow: '0 0 0 1px ' + PANEL_BORDER, // 枠線はパネルと同色で、ほぼ一体化
  };

  // 非アクティブタブ → 少し濃いグレーのチップ
  const tabButtonInactive = {
    ...tabButtonBase,
    background: '#e0e4ef',
    color: '#555',
  };

  // ===== 表示用関数（ここも今のままでOK） =====
  const renderScalarBox = (name, variable) => {
    const value = variable.value;
    return (
      <div key={name} style={varBoxStyle}>
        <div style={varNameStyle}>{name}</div>
        <div style={varValueStyle}>{String(value)}</div>
      </div>
    );
  };

  const renderArrayBox = (name, variable) => {
    const arr_val = variable.value;

    const arrayBoxStyle = {
      ...varBoxStyle,
      width: 'auto',
      minWidth: 0,
      display: 'inline-block',
    };

    const tableWrapperStyle = {
      display: 'flex',
      justifyContent: 'center',
    };

    const arrayTableStyle = {
      borderCollapse: 'collapse',
      margin: '0 auto',
    };

    const baseCellStyle = {
      border: '1px solid #777',
      padding: '2px 4px',
      fontWeight: 'bold',
      fontSize: '0.8rem',
      textAlign: 'center',
      whiteSpace: 'nowrap',
    };

    const indexCellStyle = {
      ...baseCellStyle,
      background: '#e5dedeff',
      color: '#111',
    };

    const valueCellStyle = {
      ...baseCellStyle,
      color: '#1C00CF',
    };

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
              <tbody>
                <tr>
                  {arr_val.map((val, idx) => (
                    <td key={idx} style={indexCellStyle}>
                      {idx + 1}
                    </td>
                  ))}
                </tr>
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

  const renderScopeVars = (entries) => {
    const scalarVars = entries.filter(([, variable]) => variable.kind !== 'array');
    const arrayVars = entries.filter(([, variable]) => variable.kind === 'array');

    return (
      <>
        {scalarVars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {scalarVars.map(([name, variable]) => renderScalarBox(name, variable))}
          </div>
        )}

        {arrayVars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {arrayVars.map(([name, variable]) => renderArrayBox(name, variable))}
          </div>
        )}
      </>
    );
  };

  // ===== レイアウト =====
  return (
    <div
      style={{
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: 8,
        padding: '0.6rem 0.8rem 1.8rem 0.8rem', // 下はタブ分
        background: PANEL_BG,
        height: 360,
        overflow: 'visible',                    // タブをはみ出させる
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* コンテンツ本体 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'variables' && (
          <>
            {globalentries.length > 0 && (
              <>
                <h4>グローバル変数</h4>
                {renderScopeVars(globalentries)}
              </>
            )}

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

      {/* 右下から“生えている”タブ */}
      <div
        style={{
          position: 'absolute',
          right: '0.8rem',
          bottom: '-0.8rem', // パネルの枠線をまたぐくらいの位置
        }}
      >
        <div style={tabWrapperStyle}>
          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            style={activeTab === 'variables' ? tabButtonActive : tabButtonInactive}
          >
            変数・配列
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('problem')}
            style={activeTab === 'problem' ? tabButtonActive : tabButtonInactive}
          >
            問題文
          </button>
        </div>
      </div>
    </div>
  );
}

export default VariablesPanel;
