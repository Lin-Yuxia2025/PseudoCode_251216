import React, { memo } from 'react';

const VariablesPanel = memo(function VariablesPanel({ variables }) {
  return (
    <div style={{ flex: '1 1 50%', border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#fafafa' }}>
      <h3>変数一覧</h3>
      <pre>{JSON.stringify(variables, null, 2)}</pre>
    </div>
  );
});

export default VariablesPanel;
