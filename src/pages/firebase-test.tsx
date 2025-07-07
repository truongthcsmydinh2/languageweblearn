import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, set, get } from 'firebase/database';
import { db } from '@/firebase/config';

const FirebaseTest = () => {
  const { user, loading } = useAuth();
  const [testResult, setTestResult] = useState<string>('Chưa kiểm tra');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const runTest = async () => {
    if (!user) {
      setTestResult('Vui lòng đăng nhập để kiểm tra');
      return;
    }

    try {
      setTestResult('Đang kiểm tra...');
      
      // Test 1: Ghi dữ liệu test
      const testPath = `test/${user.uid}`;
      const testRef = ref(db, testPath);
      await set(testRef, { 
        timestamp: Date.now(),
        message: 'Test connection'
      });
      
      // Test 2: Đọc dữ liệu test
      const snapshot = await get(testRef);
      
      if (snapshot.exists()) {
        setData(snapshot.val());
        setTestResult('Kết nối thành công! Ghi và đọc dữ liệu OK.');
      } else {
        setTestResult('Đã ghi nhưng không đọc được dữ liệu.');
      }
      
      setError(null);
    } catch (err) {
      console.error('Test failed:', err);
      setTestResult('Kiểm tra thất bại');
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  useEffect(() => {
    if (!loading && user) {
      runTest();
    }
  }, [loading, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">Kiểm tra kết nối Firebase</h1>
        
        <div className="mb-4">
          <p className="font-medium">Trạng thái xác thực:</p>
          <p className={`mt-1 ${user ? 'text-green-600' : 'text-red-600'}`}>
            {loading ? 'Đang kiểm tra...' : (user ? `Đã đăng nhập: ${user.email}` : 'Chưa đăng nhập')}
          </p>
        </div>
        
        <div className="mb-4">
          <p className="font-medium">Kết quả kiểm tra:</p>
          <p className={`mt-1 ${testResult.includes('thành công') ? 'text-green-600' : 'text-amber-600'}`}>
            {testResult}
          </p>
          
          {error && (
            <p className="mt-2 text-red-600 text-sm">
              Lỗi: {error}
            </p>
          )}
        </div>
        
        {data && (
          <div className="mb-4">
            <p className="font-medium">Dữ liệu:</p>
            <pre className="mt-1 bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <button
            onClick={runTest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Kiểm tra lại
          </button>
          
          {user ? (
            <button
              onClick={() => window.location.href = '/vocab'}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Đi đến Word Bank
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest; 