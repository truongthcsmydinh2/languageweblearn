import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  Activity, 
  Server, 
  Settings, 
  BarChart3, 
  FileText, 
  Shield, 
  CheckCircle, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalTerms: number;
  apiCalls: {
    gemini: number;
    openai: number;
    total: number;
  };
  tokenUsage: {
    gemini: number;
    openai: number;
    total: number;
  };
  serverStatus: 'online' | 'degraded' | 'offline';
}

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gọi API thực tế để lấy dữ liệu thống kê
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
      setIsLoading(false);
      
      // Trong môi trường development, hiển thị dữ liệu mẫu khi API chưa sẵn sàng
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading sample data in development mode');
        setStats({
          totalUsers: 54,
          totalTerms: 1250,
          apiCalls: {
            gemini: 168,
            openai: 42,
            total: 210
          },
          tokenUsage: {
            gemini: 24680,
            openai: 7830,
            total: 32510
          },
          serverStatus: 'online'
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'degraded': return 'warning';
      case 'offline': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-300">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Bảng Điều Khiển Admin
            </h1>
            <p className="text-gray-400">Quản lý và giám sát hệ thống</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Ứng dụng</span>
            </button>
            <button
              onClick={fetchStats}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-300">Đang tải dữ liệu...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Users Card */}
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-blue-300 text-sm">Người dùng</p>
                  </div>
                </div>
              </div>

              {/* Terms Card */}
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.totalTerms}</p>
                    <p className="text-green-300 text-sm">Từ vựng</p>
                  </div>
                </div>
              </div>

              {/* API Calls Card */}
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats.apiCalls.total}</p>
                    <p className="text-purple-300 text-sm">API Calls</p>
                  </div>
                </div>
              </div>

              {/* Server Status Card */}
              <div className={`bg-gradient-to-br ${stats.serverStatus === 'online' ? 'from-green-600/20 to-green-800/20 border-green-500/30' : stats.serverStatus === 'degraded' ? 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30' : 'from-red-600/20 to-red-800/20 border-red-500/30'} backdrop-blur-sm rounded-xl p-6 border`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${stats.serverStatus === 'online' ? 'bg-green-500/20' : stats.serverStatus === 'degraded' ? 'bg-yellow-500/20' : 'bg-red-500/20'} rounded-lg`}>
                    <Server className={`w-6 h-6 ${stats.serverStatus === 'online' ? 'text-green-400' : stats.serverStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`} />
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold px-3 py-1 rounded-full ${stats.serverStatus === 'online' ? 'bg-green-500/20 text-green-300' : stats.serverStatus === 'degraded' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                      {stats.serverStatus.toUpperCase()}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">Trạng thái Server</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Quản lý Hệ thống</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Database Setup */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <Settings className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Thiết lập DB</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Thiết lập và khởi tạo cơ sở dữ liệu, tạo bảng và dữ liệu mẫu.
                  </p>
                  <Link href="/admin/setup">
                    <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                      Đi đến
                    </button>
                  </Link>
                </div>

                {/* API Management */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Settings className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Quản lý API</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Quản lý API keys, cài đặt kết nối, và kiểm tra trạng thái các dịch vụ API.
                  </p>
                  <Link href="/admin/api-management">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                      Đi đến
                    </button>
                  </Link>
                </div>

                {/* Token Usage */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Thống kê Token</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Theo dõi chi phí và lượng token đã sử dụng bởi các API như Gemini và OpenAI.
                  </p>
                  <Link href="/admin/token-usage">
                    <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                      Đi đến
                    </button>
                  </Link>
                </div>

                {/* IELTS Reading */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <FileText className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">IELTS Reading</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Quản lý bài đọc và câu hỏi IELTS Reading cho học viên.
                  </p>
                  <Link href="/admin/ielts-reading">
                    <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                      Đi đến
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Security & Monitoring Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Kiểm tra & Bảo mật</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Check */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Kiểm tra Hệ thống</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Kiểm tra kết nối, API endpoints và tính năng cốt lõi của hệ thống.
                  </p>
                  <Link href="/admin/system-check">
                    <button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                      Đi đến
                    </button>
                  </Link>
                </div>

                {/* User Management */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-pink-500/20 rounded-lg">
                      <Shield className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Quản lý Người dùng</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Xem, chỉnh sửa và quản lý tài khoản người dùng và phân quyền.
                  </p>
                  <Link href="/admin/users">
                    <button className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105">
                      Đi đến
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-blue-900/50 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg">
            Không có dữ liệu thống kê. Hãy nhấn nút "Làm mới" để tải dữ liệu.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
