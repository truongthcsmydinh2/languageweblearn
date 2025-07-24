import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Key, Plus, Eye, EyeOff, Edit, Trash2, CheckCircle, XCircle,
  AlertTriangle, ChevronLeft, Search, Filter, Activity,
  Calendar, BarChart3, Zap, Shield
} from 'lucide-react';

interface ApiKey {
  id: number;
  name: string;
  service: 'google' | 'openai' | 'azure' | 'anthropic';
  key: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_used: string | null;
  usage_count: number;
}

const ApiManagement = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({
    service: 'google',
    key: '',
    name: ''
  });
  const [testResults, setTestResults] = useState<Record<string, any> | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      fetchApiKeys();
    }
  }, [user, loading, router]);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gọi API thực tế để lấy danh sách API keys
      const response = await fetch('/api/admin/tokens', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }
      
      const data = await response.json();
      setApiKeys(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Không thể tải danh sách API keys. Vui lòng thử lại sau.');
      setIsLoading(false);
      
      // Trong môi trường development, hiển thị dữ liệu mẫu khi API chưa sẵn sàng
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading sample data in development mode');
        // Dữ liệu mẫu
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        setApiKeys([
          {
            id: 1,
            name: 'Gemini Pro Production',
            service: 'google',
            key: 'AIza***********************Ahlw',
            status: 'active',
            created_at: '2023-06-15',
            last_used: today.toISOString(),
            usage_count: 168
          },
          {
            id: 2,
            name: 'OpenAI GPT-4 Production',
            service: 'openai',
            key: 'sk-*************************fDbQ',
            status: 'active',
            created_at: '2023-05-20',
            last_used: yesterday.toISOString(),
            usage_count: 42
          },
          {
            id: 3,
            name: 'Gemini Ultra Testing',
            service: 'google',
            key: 'AIza***********************KbJs',
            status: 'inactive',
            created_at: '2023-07-10',
            last_used: null,
            usage_count: 5
          },
          {
            id: 4,
            name: 'Claude 3 Production',
            service: 'anthropic',
            key: 'sk-ant-*******************DrPs',
            status: 'active',
            created_at: '2023-08-05',
            last_used: today.toISOString(),
            usage_count: 23
          }
        ]);
      }
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Gọi API thực tế để thêm API key mới
      const response = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }
      
      const result = await response.json();
      setShowAddModal(false);
      setFormData({ name: '', service: 'google', key: '' });
      setError(null);
      
      // Tải lại danh sách API keys
      fetchApiKeys();
    } catch (err) {
      console.error('Error adding API key:', err);
      setError('Không thể thêm API key. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKeyStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // Gọi API thực tế để cập nhật trạng thái API key
      const response = await fetch('/api/admin/tokens', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }
      
      // Cập nhật state
      setApiKeys(prevKeys => 
        prevKeys.map(key => 
          key.id === id ? { ...key, status: newStatus as 'active' | 'inactive' } : key
        )
      );
      
      setSuccessMessage(`Trạng thái API key đã được cập nhật thành ${newStatus === 'active' ? 'Hoạt động' : 'Không hoạt động'}`);
    } catch (err) {
      console.error('Error updating API key status:', err);
      setError('Không thể cập nhật trạng thái API key. Vui lòng thử lại sau.');
    }
  };

  const deleteKey = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa API key này không?')) {
      try {
        // Gọi API thực tế để xóa API key
        const response = await fetch(`/api/admin/tokens?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Lỗi API: ${response.status}`);
        }
        
        // Cập nhật state
        setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id));
        setError(null);
      } catch (err) {
        console.error('Error deleting API key:', err);
        setError('Không thể xóa API key. Vui lòng thử lại sau.');
      }
    }
  };

  const viewKey = (key: ApiKey) => {
    setSelectedKey(key);
    setShowKeyModal(true);
  };

  const testApiConnection = async () => {
    try {
      setIsTesting(true);
      setTestResults(null);
      
      // Giả lập kiểm tra kết nối - thay thế bằng API call thực tế trong production
      setTimeout(() => {
        setTestResults({
          google: {
            status: 'success',
            latency: '210ms',
            message: 'Kết nối thành công đến Gemini API'
          },
          openai: {
            status: 'warning',
            latency: '450ms',
            message: 'Kết nối thành công nhưng độ trễ cao'
          },
          huggingface: {
            status: 'success',
            latency: '320ms',
            message: 'Kết nối thành công đến Hugging Face API'
          },
          anthropic: {
            status: 'error',
            latency: 'N/A',
            message: 'Không tìm thấy API key'
          }
        });
        setIsTesting(false);
      }, 2000);
    } catch (err) {
      console.error('Error testing API connections:', err);
      setTestResults({
        error: 'Đã xảy ra lỗi khi kiểm tra kết nối API.'
      });
      setIsTesting(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'google': return '🌀'; // Gemini
      case 'openai': return '🤖'; // OpenAI
      case 'huggingface': return '🤗'; // Hugging Face
      case 'anthropic': return '🧠'; // Claude
      default: return '🔑';
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'google': return 'primary';
      case 'openai': return 'success';
      case 'huggingface': return 'info';
      case 'anthropic': return 'secondary';
      default: return 'dark';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge bg="success">Thành công</Badge>;
      case 'warning': return <Badge bg="warning">Cảnh báo</Badge>;
      case 'error': return <Badge bg="danger">Lỗi</Badge>;
      default: return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Key className="w-8 h-8 mr-3 text-blue-600" />
                Quản lý API Keys
              </h1>
              <p className="text-gray-600 mt-2">Quản lý các khóa API cho các dịch vụ AI</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin')}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Quay lại Dashboard
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm API Key
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                     type="text"
                     placeholder="Tìm kiếm API key..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                       value={serviceFilter}
                       onChange={(e) => setServiceFilter(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                     >
                       <option value="">Tất cả dịch vụ</option>
                       <option value="google">Google</option>
                       <option value="openai">OpenAI</option>
                       <option value="azure">Azure</option>
                       <option value="anthropic">Anthropic</option>
                     </select>
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                     >
                       <option value="">Tất cả trạng thái</option>
                       <option value="active">Hoạt động</option>
                       <option value="inactive">Không hoạt động</option>
                     </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
                <button
                  onClick={fetchApiKeys}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-sm transition-colors"
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Làm mới
                </button>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách API keys...</p>
                  </div>
                ) : apiKeys.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt sử dụng</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {apiKeys.map(apiKey => (
                          <tr key={apiKey.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apiKey.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                apiKey.service === 'google' ? 'bg-red-100 text-red-800' :
                                apiKey.service === 'openai' ? 'bg-green-100 text-green-800' :
                                apiKey.service === 'azure' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {getServiceIcon(apiKey.service)} {apiKey.service.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{apiKey.key}</code>
                                <button
                                  onClick={() => viewKey(apiKey)}
                                  className="ml-2 text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={apiKey.status === 'active'}
                                  onChange={() => toggleKeyStatus(apiKey.id, apiKey.status)}
                                  className="sr-only"
                                />
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  apiKey.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                                }`}>
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    apiKey.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                                  }`} />
                                </div>
                                <span className="ml-2 text-sm text-gray-700">
                                  {apiKey.status === 'active' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                                </span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apiKey.usage_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => deleteKey(apiKey.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">Không có API key nào. Hãy thêm API key mới để bắt đầu.</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm API Key
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Kiểm tra kết nối</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">Kiểm tra kết nối đến các API dịch vụ</p>
                <button
                  onClick={testApiConnection}
                  disabled={isTesting}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Kiểm tra tất cả API
                    </>
                  )}
                </button>

                {testResults && !testResults.error && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Kết quả kiểm tra:</h4>
                    <div className="space-y-3">
                      {Object.entries(testResults).map(([service, result]: [string, any]) => (
                        <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getServiceIcon(service)}</span>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{service}</p>
                              <p className="text-sm text-gray-600">{result.message}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.status === 'success' ? 'bg-green-100 text-green-800' :
                              result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {result.status === 'success' ? 'Thành công' :
                               result.status === 'warning' ? 'Cảnh báo' : 'Lỗi'}
                            </span>
                            {result.latency && <div className="text-xs text-gray-500 mt-1">{result.latency}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResults && testResults.error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      {testResults.error}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin sử dụng</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">Theo dõi chi tiết việc sử dụng API và token</p>
                <Link href="/admin/token-usage">
                  <a className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Xem thống kê chi tiết
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>

      {/* Modal thêm API key mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Thêm API Key mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddKey}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                  <input
                    type="text"
                    placeholder="Nhập tên để nhận diện API key này"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ví dụ: "Gemini API Production", "OpenAI Testing"
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dịch vụ</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="google">Google (Gemini)</option>
                    <option value="openai">OpenAI</option>
                    <option value="huggingface">Hugging Face</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    placeholder="Nhập API key"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    API key sẽ được mã hóa trước khi lưu vào cơ sở dữ liệu.
                  </p>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddKey}
                disabled={!formData.key || !formData.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết API key */}
      {showKeyModal && selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{selectedKey.name}</h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Dịch vụ:</p>
                  <p className="text-gray-900">{getServiceIcon(selectedKey.service)} {selectedKey.service.toUpperCase()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">API Key:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={selectedKey.key}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedKey.key)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Trạng thái:</p>
                  <p className="text-gray-900">{selectedKey.status === 'active' ? 'Đang hoạt động' : 'Vô hiệu hóa'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Ngày tạo:</p>
                  <p className="text-gray-900">{new Date(selectedKey.created_at).toLocaleString()}</p>
                </div>
                
                {selectedKey.last_used && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Lần sử dụng cuối:</p>
                    <p className="text-gray-900">{new Date(selectedKey.last_used).toLocaleString()}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Lượt sử dụng:</p>
                  <p className="text-gray-900">{selectedKey.usage_count}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ApiManagement;
