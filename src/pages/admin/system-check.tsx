// src/pages/admin/system-check.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const SystemCheckPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const runSystemCheck = async () => {
    if (!user || !user.uid) {
      alert('Bạn cần đăng nhập để thực hiện kiểm tra hệ thống');
      return;
    }

    try {
      setIsChecking(true);
      setResults(null);
      
      // Kiểm tra API vocab
      console.log('Checking vocab API...');
      const vocabResponse = await fetch('/api/vocab', {
        headers: {
          'firebase_uid': user.uid
        }
      });
      const vocabData = await vocabResponse.json();
      
      // Kiểm tra API learning/smart
      console.log('Checking learning/smart API...');
      const learningResponse = await fetch('/api/learning/smart', {
        headers: {
          'firebase_uid': user.uid
        }
      });
      const learningData = await learningResponse.json();
      
      // Thử thêm một từ vựng test
      console.log('Testing vocab add...');
      const testTerm = {
        vocab: `test_${Date.now()}`,
        meaning: 'Từ kiểm tra',
        level: 0,
        timeAdded: Date.now(),
        reviewTime: Date.now()
      };
      
      const addResponse = await fetch('/api/vocab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: JSON.stringify(testTerm)
      });
      const addData = await addResponse.json();
      
      // Xóa từ vựng test
      console.log('Cleaning up test term...');
      if (addData.success && addData.id) {
        await fetch('/api/vocab', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'firebase_uid': user.uid
          },
          body: JSON.stringify({ id: addData.id })
        });
      }
      
      // Tổng hợp kết quả
      setResults({
        vocabApi: {
          status: vocabResponse.status,
          termsCount: Array.isArray(vocabData) ? vocabData.length : 'N/A',
          termsWithUid: Array.isArray(vocabData) 
            ? vocabData.filter(term => term.firebase_uid === user.uid).length 
            : 'N/A',
          termsWithoutUid: Array.isArray(vocabData) 
            ? vocabData.filter(term => !term.firebase_uid).length 
            : 'N/A'
        },
        learningApi: {
          status: learningResponse.status,
          termsCount: learningData.terms ? learningData.terms.length : 'N/A',
          message: learningData.message || 'N/A'
        },
        addTest: {
          status: addResponse.status,
          success: addData.success || false,
          id: addData.id || 'N/A'
        }
      });
      
    } catch (error) {
      console.error('Error during system check:', error);
      setResults({ error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định' });
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Kiểm tra hệ thống</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          Trang này sẽ kiểm tra các API chính của hệ thống và xác nhận rằng firebase_uid 
          đang được sử dụng đúng cách.
        </p>
      </div>
      
      <div className="mb-6">
        <p className="mb-2"><strong>Firebase UID hiện tại:</strong> {user?.uid}</p>
        <p className="mb-4"><strong>Email:</strong> {user?.email}</p>
        
        <button
          onClick={runSystemCheck}
          disabled={isChecking}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isChecking ? 'Đang kiểm tra...' : 'Chạy kiểm tra hệ thống'}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          {results.error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700"><strong>Lỗi:</strong> {results.error}</p>
            </div>
          ) : (
            <>
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Kết quả kiểm tra API Vocab</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Status:</strong> {results.vocabApi.status}</p>
                    <p><strong>Tổng số từ:</strong> {results.vocabApi.termsCount}</p>
                  </div>
                  <div>
                    <p><strong>Có UID:</strong> {results.vocabApi.termsWithUid}</p>
                    <p><strong>Không có UID:</strong> {results.vocabApi.termsWithoutUid}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Kết quả kiểm tra API Learning</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Status:</strong> {results.learningApi.status}</p>
                    <p><strong>Số từ học:</strong> {results.learningApi.termsCount}</p>
                  </div>
                  <div>
                    <p><strong>Message:</strong> {results.learningApi.message}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Kết quả kiểm tra thêm từ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Status:</strong> {results.addTest.status}</p>
                    <p><strong>Thành công:</strong> {results.addTest.success ? 'Có' : 'Không'}</p>
                  </div>
                  <div>
                    <p><strong>ID tạo:</strong> {results.addTest.id}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemCheckPage;