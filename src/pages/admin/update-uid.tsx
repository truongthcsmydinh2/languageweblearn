// src/pages/admin/update-uid.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const UpdateFirebaseUidPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; updatedCount?: number; error?: string } | null>(null);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const handleUpdateUid = async () => {
    if (!user || !user.uid) {
      alert('Bạn cần đăng nhập để thực hiện thao tác này');
      return;
    }

    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/admin/update-firebase-uid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebase_uid: user.uid }),
      });

      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        alert(`Đã cập nhật thành công ${data.updatedCount} từ vựng với firebase_uid của bạn.`);
      } else {
        alert(`Lỗi: ${data.error || 'Không thể cập nhật dữ liệu'}`);
      }
    } catch (error) {
      console.error('Error updating firebase_uid:', error);
      setResult({ error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định' });
      alert('Đã xảy ra lỗi khi cập nhật dữ liệu.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cập nhật Firebase UID cho từ vựng</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Lưu ý:</strong> Thao tác này sẽ cập nhật tất cả các từ vựng chưa có firebase_uid 
          với ID của tài khoản hiện tại của bạn. Hãy đảm bảo bạn đang đăng nhập với đúng tài khoản.
        </p>
      </div>
      
      <div className="mb-6">
        <p className="mb-2"><strong>Firebase UID hiện tại:</strong> {user?.uid}</p>
        <p className="mb-4"><strong>Email:</strong> {user?.email}</p>
        
        <button
          onClick={handleUpdateUid}
          disabled={isUpdating}
          className={`px-4 py-2 rounded-lg ${
            isUpdating 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isUpdating ? 'Đang cập nhật...' : 'Cập nhật tất cả từ vựng'}
        </button>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg ${
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.success ? (
            <p>Đã cập nhật thành công {result.updatedCount} từ vựng.</p>
          ) : (
            <p>Lỗi: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdateFirebaseUidPage;