import { useState } from 'react';
import { checkEmailAvailability } from '../utils/emailCheck';

export default function EmailCheckTest() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const isAvailable = await checkEmailAvailability(email);
      setResult(isAvailable);
    } catch (error) {
      console.error('Error checking email:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Email Availability Test</h1>
      
      <div className="mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email to check"
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={checkEmail}
          disabled={loading || !email}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Email'}
        </button>
      </div>

      {result !== null && (
        <div className={`p-4 rounded ${result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result ? 'Email is available!' : 'Email is already registered!'}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>Test emails:</p>
        <ul className="list-disc ml-4">
          <li>test@bookinghse.com (should be taken)</li>
          <li>pierluigi.pisanti@gmail.com (should be taken)</li>
          <li>newuser@example.com (should be available)</li>
        </ul>
      </div>
    </div>
  );
}