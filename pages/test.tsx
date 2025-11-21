import { useEffect, useState } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState('loading');
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    const testAPIs = async () => {
      try {
        // 测试 ping API
        const pingResponse = await fetch('/api/ping');
        const pingData = await pingResponse.json();
        setApiTest(pingData);

        setStatus('success');
      } catch (error) {
        console.error('API test failed:', error);
        setStatus('error');
      }
    };

    testAPIs();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>应用诊断页面</h1>

      <div style={{ marginBottom: 20 }}>
        <strong>状态:</strong> <span style={{ color: status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange' }}>{status}</span>
      </div>

      {apiTest && (
        <div style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 5 }}>
          <h3>API 测试结果:</h3>
          <pre>{JSON.stringify(apiTest, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h3>快速链接测试:</h3>
        <ul>
          <li><a href="/api/ping" target="_blank">/api/ping</a></li>
          <li><a href="/api/health" target="_blank">/api/health</a></li>
          <li><a href="/api/listings" target="_blank">/api/listings</a></li>
        </ul>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>手动测试:</h3>
        <button
          onClick={() => window.location.href = '/'}
          style={{ padding: '10px 20px', marginRight: 10 }}
        >
          返回首页
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '10px 20px' }}
        >
          刷新页面
        </button>
      </div>
    </div>
  );
}