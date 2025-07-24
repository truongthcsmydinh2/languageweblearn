import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Database, Play, CheckCircle, XCircle, AlertTriangle, 
  ArrowLeft, Settings, Table, Users, Key, BarChart3
} from 'lucide-react';

interface SetupTask {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

const AdminSetup = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<SetupTask[]>([
    {
      id: 'main-tables',
      name: 'Thiết lập bảng chính',
      description: 'Tạo các bảng cơ bản cho hệ thống (users, sessions, etc.)',
      endpoint: '/api/setup-table',
      icon: <Table className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 'token-usage',
      name: 'Bảng Token Usage',
      description: 'Tạo bảng lưu trữ dữ liệu sử dụng token và API calls',
      endpoint: '/api/setup-token-usage-table',
      icon: <BarChart3 className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 'api-keys',
      name: 'Bảng API Keys',
      description: 'Tạo bảng quản lý API keys cho các dịch vụ AI',
      endpoint: '/api/admin/tokens',
      icon: <Key className="w-5 h-5" />,
      status: 'pending'
    }
  ]);

  const runTask = async (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running', message: undefined }
        : task
    ));

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch(task.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, status: 'success', message: data.message || 'Thành công!' }
            : t
        ));
      } else {
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, status: 'error', message: data.message || 'Có lỗi xảy ra' }
            : t
        ));
      }
    } catch (error) {
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'error', message: 'Lỗi kết nối API' }
          : t
      ));
    }
  };

  const runAllTasks = async () => {
    for (const task of tasks) {
      await runTask(task.id);
      // Delay giữa các task để tránh overload
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại Dashboard
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thiết lập Database</h1>
          </div>
          <p className="text-gray-600">
            Chạy các script thiết lập để tạo bảng database và dữ liệu mẫu cho hệ thống.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Thao tác nhanh</h2>
              <p className="text-gray-600 text-sm">Chạy tất cả các task thiết lập cùng lúc</p>
            </div>
            <button
              onClick={runAllTasks}
              disabled={tasks.some(task => task.status === 'running')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Chạy tất cả
            </button>
          </div>
        </div>

        {/* Setup Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách thiết lập</h2>
          
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`border rounded-xl p-6 transition-all ${getStatusColor(task.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    {task.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {task.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {task.description}
                    </p>
                    {task.message && (
                      <div className={`text-sm p-3 rounded-lg ${
                        task.status === 'success' 
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : task.status === 'error'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {task.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusIcon(task.status)}
                  <button
                    onClick={() => runTask(task.id)}
                    disabled={task.status === 'running'}
                    className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Chạy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-blue-900 font-medium mb-1">Lưu ý quan trọng</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Chỉ chạy setup một lần khi khởi tạo hệ thống</li>
                <li>• Đảm bảo database connection đã được cấu hình đúng</li>
                <li>• Backup dữ liệu trước khi chạy setup trong môi trường production</li>
                <li>• Một số task có thể tạo dữ liệu mẫu để test</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;