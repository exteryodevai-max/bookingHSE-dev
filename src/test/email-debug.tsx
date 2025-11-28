import { useState } from 'react';
import { checkEmailAvailability } from '../utils/emailCheck';

export default function EmailDebugTest() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing email:', email);
      const isAvailable = await checkEmailAvailability(email);
      console.log('Email availability result:', isAvailable);
      setResult(isAvailable);
    } catch (err) {
      console.error('Email check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Email Availability Debug Test</h1>
      <p>This page helps debug the email availability checking functionality.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email to test"
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={testEmail}
          disabled={loading || !email}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Email Availability'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result !== null && (
        <div style={{
          padding: '10px',
          backgroundColor: result ? '#d4edda' : '#fff3cd',
          border: '1px solid',
          borderColor: result ? '#c3e6cb' : '#ffeaa7',
          borderRadius: '4px',
          color: result ? '#155724' : '#856404'
        }}>
          <strong>Result:</strong> Email {email} is {result ? 'available' : 'already taken'}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Open browser developer console (F12)</li>
          <li>Enter an email address above</li>
          <li>Click "Test Email Availability"</li>
          <li>Check console for detailed logs</li>
          <li>The 406 error should appear in the Network tab</li>
        </ol>
      </div>
    </div>
  );
}