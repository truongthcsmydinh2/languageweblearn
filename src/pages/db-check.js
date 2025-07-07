import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DbCheckPage() {
  const { user } = useAuth();
  const [mysqlStatus, setMysqlStatus] = useState({loading: true, connected: false, message: '', details: null});
  const [userSaved, setUserSaved] = useState({loading: true, success: false, message: ''});
  const [tables, setTables] = useState({loading: true, list: [], error: null});

  // Kiểm tra kết nối MySQL
  useEffect(() => {
    async function checkMySQLConnection() {
      try {
        const response = await fetch('/api/check-mysql');
        const data = await response.json();
        
        setMysqlStatus({
          loading: false, 
          connected: data.success, 
          message: data.message,
          details: data.serverInfo || data.error
        });
      } catch (error) {
        setMysqlStatus({
          loading: false,
          connected: false,
          message: 'Lỗi khi kiểm tra kết nối',
          details: error.message
        });
      }
    }
    
    checkMySQLConnection();
  }, []);

  // Kiểm tra lưu user
  useEffect(() => {
    async function checkUserSave() {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          })
        });
        
        const data = await response.json();
        setUserSaved({
          loading: false,
          success: data.success,
          message: data.success ? 'Đã lưu thông tin user thành công' : data.error || 'Lỗi không xác định'
        });
      } catch (error) {
        setUserSaved({
          loading: false,
          success: false,
          message: error.message
        });
      }
    }
    
    if (user) {
      checkUserSave();
    }
  }, [user]);

  // Kiểm tra bảng đã tạo
  useEffect(() => {
    async function checkTables() {
      try {
        const response = await fetch('/api/check-tables');
        const data = await response.json();
        
        setTables({
          loading: false,
          list: data.tables || [],
          error: data.error
        });
      } catch (error) {
        setTables({
          loading: false,
          list: [],
          error: error.message
        });
      }
    }
    
    checkTables();
  }, []);

  // Tạo bảng mới
  const setupTables = async () => {
    try {
      const response = await fetch('/api/setup-tables');
      const data = await response.json();
      
      alert(data.message);
      // Tải lại danh sách bảng
      window.location.reload();
    } catch (error) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Kiểm tra kết nối Database</h1>
      
      {/* Trạng thái kết nối MySQL */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Kết nối MySQL</h2>
        
        {mysqlStatus.loading ? (
          <p>Đang kiểm tra kết nối...</p>
        ) : (
          <div>
            <div className={`text-lg font-medium ${mysqlStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              {mysqlStatus.connected ? '✅ Đã kết nối' : '❌ Chưa kết nối'}
            </div>
            <p className="mt-1">{mysqlStatus.message}</p>
            {mysqlStatus.details && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(mysqlStatus.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
      
      {/* Trạng thái lưu user */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Lưu thông tin User</h2>
        
        {!user ? (
          <p className="text-orange-500">Vui lòng đăng nhập để kiểm tra</p>
        ) : userSaved.loading ? (
          <p>Đang kiểm tra...</p>
        ) : (
          <div>
            <div className={`text-lg font-medium ${userSaved.success ? 'text-green-600' : 'text-red-600'}`}>
              {userSaved.success ? '✅ Đã lưu thành công' : '❌ Lưu thất bại'}
            </div>
            <p className="mt-1">{userSaved.message}</p>
          </div>
        )}
      </div>
      
      {/* Danh sách bảng */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Bảng trong Database</h2>
        
        {tables.loading ? (
          <p>Đang tải danh sách bảng...</p>
        ) : tables.error ? (
          <div>
            <p className="text-red-600">Lỗi: {tables.error}</p>
            <button 
              onClick={setupTables}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tạo bảng mới
            </button>
          </div>
        ) : (
          <div>
            {tables.list.length === 0 ? (
              <div>
                <p className="text-orange-500">Chưa có bảng nào</p>
                <button 
                  onClick={setupTables}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tạo bảng mới
                </button>
              </div>
            ) : (
              <ul className="list-disc pl-5">
                {tables.list.map((table, index) => (
                  <li key={index}>{table}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 