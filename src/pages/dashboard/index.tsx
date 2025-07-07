import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Đăng ký Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Định nghĩa kiểu dữ liệu
interface LevelStat {
  level: number;
  count: number;
}

interface ActivityData {
  date: string;
  count: number;
}

interface DashboardStats {
  totalTerms: number;
  levelStats: LevelStat[];
  levelStatsVi: LevelStat[];
  recentTerms: number;
  termsToReview: number;
  learnedTerms: number;
  masteredTerms: number;
  dailyActivity: ActivityData[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTerms: 0,
    levelStats: [],
    levelStatsVi: [],
    recentTerms: 0,
    termsToReview: 0,
    learnedTerms: 0,
    masteredTerms: 0,
    dailyActivity: []
  });
  const [activeTab, setActiveTab] = useState('en'); // 'en' hoặc 'vi'

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stats/overview', {
          headers: {
            'firebase_uid': user.uid
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  // Lấy dữ liệu cấp độ dựa trên tab đang chọn
  const getLevelStats = (): LevelStat[] => {
    return activeTab === 'en' ? stats.levelStats : stats.levelStatsVi;
  };

  // Dữ liệu cho biểu đồ cấp độ từ
  const levelChartData = {
    labels: getLevelStats().map(item => `Level ${item.level}`),
    datasets: [
      {
        label: 'Số từ vựng',
        data: getLevelStats().map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 205, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(201, 203, 207, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 205, 86, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ hoạt động hàng ngày
  const activityChartData = {
    labels: stats.dailyActivity.map(item => item.date),
    datasets: [
      {
        label: 'Từ vựng đã thêm',
        data: stats.dailyActivity.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  const activityOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Từ vựng thêm mới theo ngày',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-50 mb-8">Dashboard</h1>
        
        {/* Thẻ thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-700 rounded-xl shadow-md p-6">
            <div className="text-primary-200 text-4xl font-bold">{stats.totalTerms}</div>
            <div className="text-gray-400 mt-2">Tổng số từ vựng</div>
          </div>
          
          <div className="bg-gray-700 rounded-xl shadow-md p-6">
            <div className="text-secondary-200 text-4xl font-bold">{stats.recentTerms}</div>
            <div className="text-gray-400 mt-2">Từ mới (7 ngày qua)</div>
          </div>
          
          <div className="bg-gray-700 rounded-xl shadow-md p-6">
            <div className="text-warning-200 text-4xl font-bold">{stats.termsToReview}</div>
            <div className="text-gray-400 mt-2">Từ cần ôn tập</div>
          </div>
          
          <div className="bg-gray-700 rounded-xl shadow-md p-6">
            <div className="text-success-200 text-4xl font-bold">{stats.masteredTerms}</div>
            <div className="text-gray-400 mt-2">Từ đã thuộc (Level 5+)</div>
          </div>
        </div>
        
        {/* Tab chọn ngôn ngữ */}
        <div className="flex mb-6">
          <button 
            className={`px-4 py-2 rounded-l-lg ${activeTab === 'en' ? 'bg-primary-200 text-gray-800' : 'bg-gray-700 text-gray-400'}`}
            onClick={() => setActiveTab('en')}
          >
            Tiếng Anh
          </button>
          <button 
            className={`px-4 py-2 rounded-r-lg ${activeTab === 'vi' ? 'bg-primary-200 text-gray-800' : 'bg-gray-700 text-gray-400'}`}
            onClick={() => setActiveTab('vi')}
          >
            Tiếng Việt
          </button>
        </div>
        
        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-gray-700 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-50 mb-4">
              Phân tích theo cấp độ ({activeTab === 'en' ? 'Tiếng Anh' : 'Tiếng Việt'})
            </h2>
            <div className="space-y-4">
              {/* Từ mới (Level 0) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Từ mới (Level 0)</span>
                  <span className="text-green-600 font-medium">
                    {getLevelStats().filter(item => item.level === 0).reduce((acc, curr) => acc + curr.count, 0)} từ
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full" 
                    style={{ 
                      width: `${stats.totalTerms ? 
                        (getLevelStats().filter(item => item.level === 0).reduce((acc, curr) => acc + curr.count, 0) / stats.totalTerms * 100) 
                        : 0}%` 
                      }}>
                  </div>
                </div>
              </div>
              
              {/* Đang học (Level 1-3) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Đang học (Level 1-3)</span>
                  <span className="text-green-600 font-medium">
                    {getLevelStats().filter(item => item.level >= 1 && item.level <= 3).reduce((acc, curr) => acc + curr.count, 0)} từ
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ 
                      width: `${stats.totalTerms ? 
                        (getLevelStats().filter(item => item.level >= 1 && item.level <= 3).reduce((acc, curr) => acc + curr.count, 0) / stats.totalTerms * 100) 
                        : 0}%` 
                      }}>
                  </div>
                </div>
              </div>
              
              {/* Cơ bản (Level 4-7) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Cơ bản (Level 4-7)</span>
                  <span className="text-green-600 font-medium">
                    {getLevelStats().filter(item => item.level >= 4 && item.level <= 7).reduce((acc, curr) => acc + curr.count, 0)} từ
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ 
                      width: `${stats.totalTerms ? 
                        (getLevelStats().filter(item => item.level >= 4 && item.level <= 7).reduce((acc, curr) => acc + curr.count, 0) / stats.totalTerms * 100) 
                        : 0}%` 
                      }}>
                  </div>
                </div>
              </div>
              
              {/* Thành thạo (Level 8-10) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Thành thạo (Level 8-10)</span>
                  <span className="text-green-600 font-medium">
                    {getLevelStats().filter(item => item.level >= 8 && item.level <= 10).reduce((acc, curr) => acc + curr.count, 0)} từ
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ 
                      width: `${stats.totalTerms ? 
                        (getLevelStats().filter(item => item.level >= 8 && item.level <= 10).reduce((acc, curr) => acc + curr.count, 0) / stats.totalTerms * 100) 
                        : 0}%` 
                      }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-red-500 mb-4">Hoạt động 30 ngày qua</h2>
            {stats.dailyActivity && stats.dailyActivity.length > 0 ? (
              <div className="h-64">
                <Bar data={activityChartData} options={activityOptions} />
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
        
        {/* Thông tin học tập */}
        <div className="bg-gray-700 rounded-xl shadow-md p-6 mb-10">
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Tổng quan học tập</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-primary-200 mb-2">Tiếng Anh</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Số từ đã học:</span>
                  <span className="font-medium text-gray-50">{stats.levelStats?.filter(item => item.level > 0).reduce((acc, curr) => acc + curr.count, 0) || 0} từ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Số từ đã thuộc:</span>
                  <span className="font-medium text-gray-50">{stats.levelStats?.filter(item => item.level >= 5).reduce((acc, curr) => acc + curr.count, 0) || 0} từ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tỷ lệ thuộc:</span>
                  <span className="font-medium text-gray-50">
                    {stats.totalTerms ? 
                      Math.round((stats.levelStats?.filter(item => item.level >= 5).reduce((acc, curr) => acc + curr.count, 0) || 0) / stats.totalTerms * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-primary-200 mb-2">Tiếng Việt</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Số từ đã học:</span>
                  <span className="font-medium text-gray-50">{stats.levelStatsVi?.filter(item => item.level > 0).reduce((acc, curr) => acc + curr.count, 0) || 0} từ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Số từ đã thuộc:</span>
                  <span className="font-medium text-gray-50">{stats.levelStatsVi?.filter(item => item.level >= 5).reduce((acc, curr) => acc + curr.count, 0) || 0} từ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tỷ lệ thuộc:</span>
                  <span className="font-medium text-gray-50">
                    {stats.totalTerms ? 
                      Math.round((stats.levelStatsVi?.filter(item => item.level >= 5).reduce((acc, curr) => acc + curr.count, 0) || 0) / stats.totalTerms * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 