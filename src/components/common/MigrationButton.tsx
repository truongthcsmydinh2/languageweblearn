import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function MigrationButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const handleMigration = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      const data = await response.json();
      
      setResult({
        success: data.success,
        message: data.message
      });
    } catch (error) {
      setResult({
        success: false,
        message: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mb-4">
      <button
        onClick={handleMigration}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Cập nhật dữ liệu...' : 'Cập nhật cấu trúc dữ liệu'}
      </button>
      
      {result && (
        <div className={`mt-2 p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
