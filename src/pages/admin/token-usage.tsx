import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';

interface TokenUsage {
  date: string;
  service: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  apiCalls: number;
}

interface MonthlyUsage {
  month: string;
  totalTokens: number;
  totalCost: number;
  services: {
    [key: string]: {
      tokensIn: number;
      tokensOut: number;
      cost: number;
    }
  }
}

const TokenUsagePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<TokenUsage[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([]);
  const [timeRange, setTimeRange] = useState('week');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      fetchTokenUsage();
    }
  }, [user, loading, router, timeRange, serviceFilter]);

  const fetchTokenUsage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gọi API thực tế để lấy dữ liệu token usage
      const response = await fetch(`/api/admin/token-usage?timeRange=${timeRange}&serviceFilter=${serviceFilter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }
      
      const data = await response.json();
      setDailyUsage(data.dailyUsage || []);
      setMonthlyUsage(data.monthlyUsage || []);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching token usage data:', err);
      setError('Không thể tải dữ liệu sử dụng token. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };
  
  const getServiceBadge = (service: string) => {
    const colors: Record<string, string> = {
      google: 'bg-blue-100 text-blue-800',
      openai: 'bg-green-100 text-green-800',
      huggingface: 'bg-yellow-100 text-yellow-800',
      anthropic: 'bg-purple-100 text-purple-800'
    };
    
    const icons: Record<string, string> = {
      google: '🌀',
      openai: '🤖',
      huggingface: '🤗',
      anthropic: '🧠'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[service] || 'bg-gray-100 text-gray-800'
      }`}>
        {icons[service] || '🔑'} {service.toUpperCase()}
      </span>
    );
  };
  
  const calculateTotals = () => {
    const totals = {
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
      apiCalls: 0
    };
    
    dailyUsage.forEach(item => {
      totals.tokensIn += item.tokensIn;
      totals.tokensOut += item.tokensOut;
      totals.cost += item.cost;
      totals.apiCalls += item.apiCalls;
    });
    
    return totals;
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 23000); // Giả định tỉ giá USD/VND
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê Sử dụng Token</h1>
            <p className="text-gray-600">Theo dõi chi phí và lượng token đã sử dụng</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </button>
            <button
              onClick={fetchTokenUsage}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Khoảng thời gian
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Hôm nay</option>
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Dịch vụ
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả dịch vụ</option>
                <option value="google">Google (Gemini)</option>
                <option value="openai">OpenAI</option>
                <option value="huggingface">Hugging Face</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu thống kê...</p>
          </div>
        ) : (
        <>
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm"
                >
                  Sử dụng Chi tiết
                </button>
                <button
                  className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  Báo cáo Tháng
                </button>
                <button
                  className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  So sánh Chi phí
                </button>
                <button
                  className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  Dự báo
                </button>
              </nav>
            </div>
          </div>

          {/* Usage Details Tab */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sử dụng Token Theo Ngày</h3>
            </div>
            <div className="p-6">
              {dailyUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens (In)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens (Out)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Token</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí (USD)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Calls</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyUsage.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getServiceBadge(item.service)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.tokensIn)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.tokensOut)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatNumber(item.tokensIn + item.tokensOut)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.cost)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.apiCalls}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t border-gray-200">
                        <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">Tổng cộng</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatNumber(calculateTotals().tokensIn)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatNumber(calculateTotals().tokensOut)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatNumber(calculateTotals().tokensIn + calculateTotals().tokensOut)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(calculateTotals().cost)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{calculateTotals().apiCalls}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">Không có dữ liệu cho khoảng thời gian và dịch vụ đã chọn.</p>
              )}
            </div>
          </div>
            
          {/* Monthly Report Tab */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tổng hợp theo tháng</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gemini</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OpenAI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hugging Face</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claude</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi phí</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyUsage.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.totalTokens)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.services.google.tokensIn + item.services.google.tokensOut)}
                        <div className="text-gray-500 text-xs">
                          {formatCurrency(item.services.google.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.services.openai.tokensIn + item.services.openai.tokensOut)}
                        <div className="text-gray-500 text-xs">
                          {formatCurrency(item.services.openai.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.services.huggingface.tokensIn + item.services.huggingface.tokensOut)}
                        <div className="text-gray-500 text-xs">
                          {formatCurrency(item.services.huggingface.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.services.anthropic.tokensIn + item.services.anthropic.tokensOut)}
                        <div className="text-gray-500 text-xs">
                          {formatCurrency(item.services.anthropic.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            
          {/* Cost Comparison Tab */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">So sánh Chi phí giữa các Dịch vụ</h3>
            </div>
            <div className="p-6">
              <p className="mb-6 text-gray-600">Bảng so sánh chi phí sử dụng token giữa các nhà cung cấp API AI:</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Dịch vụ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Mô hình</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Giá Token Đầu vào</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Giá Token Đầu ra</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Độ chính xác</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tính năng đặc biệt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Google Gemini</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">Gemini Pro</div>
                        <div className="text-sm text-gray-900">Gemini Flash</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.00025 / 1K tokens</div>
                        <div className="text-sm text-gray-900">$0.0001 / 1K tokens</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.0005 / 1K tokens</div>
                        <div className="text-sm text-gray-900">$0.0002 / 1K tokens</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">Cao</td>
                      <td className="px-6 py-4 text-sm text-gray-900">Multimodal, cửa sổ ngữ cảnh lớn</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">OpenAI</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">GPT-4 Turbo</div>
                        <div className="text-sm text-gray-900">GPT-3.5 Turbo</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.01 / 1K tokens</div>
                        <div className="text-sm text-gray-900">$0.0005 / 1K tokens</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.03 / 1K tokens</div>
                        <div className="text-sm text-gray-900">$0.0015 / 1K tokens</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">Rất cao</td>
                      <td className="px-6 py-4 text-sm text-gray-900">Vision, DALL-E, fine-tuning</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Anthropic</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">Claude 3 Opus</div>
                        <div className="text-sm text-gray-900">Claude 3 Haiku</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.015 / 1K tokens</div>
                        <div className="text-sm text-gray-900">$0.00025 / 1K tokens</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.075 / 1K tokens</div>
                        <div className="text-sm text-gray-900">$0.00125 / 1K tokens</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">Rất cao</td>
                      <td className="px-6 py-4 text-sm text-gray-900">Chất lượng văn bản cao, cửa sổ ngữ cảnh 200K tokens</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">Hugging Face</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">Mixtral 8x7B</div>
                        <div className="text-sm text-gray-900">Llama 2</div>
                      </td>
                      <td colSpan={2} className="px-6 py-4 border-r border-gray-200">
                        <div className="text-sm text-gray-900">$0.0002 / 1K tokens (hoặc tự host)</div>
                        <div className="text-sm text-gray-900">Miễn phí hoặc theo chi phí infrastructure</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">Trung bình - Cao</td>
                      <td className="px-6 py-4 text-sm text-gray-900">Mô hình mã nguồn mở, self-hosting, tùy chỉnh cao</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h6 className="text-blue-900 font-medium mb-2">Tips tiết kiệm chi phí:</h6>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Sử dụng Gemini Flash cho các tác vụ đơn giản</li>
                      <li>• Dùng Claude 3 Haiku cho những tác vụ cần cửa sổ ngữ cảnh lớn</li>
                      <li>• Xem xét self-hosting với mô hình mã nguồn mở như Mixtral cho khối lượng cao</li>
                      <li>• Tối ưu hóa prompt để giảm lượng token</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cost Forecast */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dự báo Chi phí</h3>
            <p className="text-gray-600 mb-4">Dựa trên dữ liệu hiện tại, chi phí ước tính cho tháng này:</p>
            <div className="text-3xl font-bold text-blue-600 mb-4">{formatCurrency(calculateTotals().cost * 3)}</div>
            <p className="text-gray-500 text-sm">
              Dự báo này được tính dựa trên xu hướng sử dụng hiện tại. Cài đặt cảnh báo chi phí trong trang Cài đặt.
            </p>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default TokenUsagePage;
