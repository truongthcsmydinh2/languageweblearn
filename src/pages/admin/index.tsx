import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';

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
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Bảng Điều Khiển Admin</h1>
        <div>
          <Button variant="outline-secondary" onClick={() => router.push('/dashboard')} className="me-2">
            Quay lại Ứng dụng
          </Button>
          <Button variant="primary" onClick={fetchStats}>
            Làm mới
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : stats ? (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="display-4">{stats.totalUsers}</h3>
                  <Card.Title>Người dùng</Card.Title>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="display-4">{stats.totalTerms}</h3>
                  <Card.Title>Từ vựng</Card.Title>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="display-4">{stats.apiCalls.total}</h3>
                  <Card.Title>API Calls</Card.Title>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="display-4 text-nowrap">
                    <span className={`badge bg-${getStatusColor(stats.serverStatus)}`}>
                      {stats.serverStatus.toUpperCase()}
                    </span>
                  </h3>
                  <Card.Title>Trạng thái Server</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <h2 className="mb-3">Quản lý Hệ thống</h2>
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Quản lý API</Card.Title>
                  <Card.Text>
                    Quản lý API keys, cài đặt kết nối, và kiểm tra trạng thái các dịch vụ API.
                  </Card.Text>
                  <Link href="/admin/api-management" passHref>
                    <Button variant="primary">Đi đến</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Thống kê Token</Card.Title>
                  <Card.Text>
                    Theo dõi chi phí và lượng token đã sử dụng bởi các API như Gemini và OpenAI.
                  </Card.Text>
                  <Link href="/admin/token-usage" passHref>
                    <Button variant="primary">Đi đến</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Cài đặt Hệ thống</Card.Title>
                  <Card.Text>
                    Quản lý các cài đặt chung, giới hạn sử dụng và thông báo.
                  </Card.Text>
                  <Link href="/admin/settings" passHref>
                    <Button variant="primary">Đi đến</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <h2 className="mb-3">Kiểm tra & Bảo mật</h2>
          <Row>
            <Col md={6} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Kiểm tra Hệ thống</Card.Title>
                  <Card.Text>
                    Kiểm tra kết nối, API endpoints và tính năng cốt lõi của hệ thống.
                  </Card.Text>
                  <Link href="/admin/system-check" passHref>
                    <Button variant="primary">Đi đến</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Quản lý Người dùng</Card.Title>
                  <Card.Text>
                    Xem, chỉnh sửa và quản lý tài khoản người dùng và phân quyền.
                  </Card.Text>
                  <Link href="/admin/users" passHref>
                    <Button variant="primary">Đi đến</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Alert variant="info">
          Không có dữ liệu thống kê. Hãy nhấn nút "Làm mới" để tải dữ liệu.
        </Alert>
      )}
    </Container>
  );
};

export default AdminDashboard;
