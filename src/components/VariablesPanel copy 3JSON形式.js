import React from 'react';

// 親(index)から渡された props 中の variables を分割代入 (直接 variables で使える)
function VariablesPanel({ variables }) {
  const formatValue = (value) => {
    if (Array.isArray(value)) return JSON.stringify(value);      // 配列は1行
    return JSON.stringify(value, null, 2);                       // その他は改行＋インデント
  };

  return (
    <div style={{ flex: '1 1 50%', border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#fafafa' }}>
      <h3>変数一覧</h3>
      {/* JavaScript のオブジェクト variables を JSON 文字列に変換 */}
      {/* JSON.stringify(value, replacer, space) */}
      <pre>{formatValue(variables)}</pre>
    </div>
  );
}

export default VariablesPanel;
