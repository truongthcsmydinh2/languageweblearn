import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Container, Row, Col, Card, Button, Form, Spinner,
  Table, Badge, Alert, Modal, InputGroup
} from 'react-bootstrap';

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
        <div>
          <h1>Quản lý API</h1>
          <p className="text-muted">Quản lý API keys và cài đặt kết nối</p>
        </div>
        <div>
          <Button variant="outline-secondary" onClick={() => router.push('/admin')} className="me-2">
            Quay lại Dashboard
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Thêm API Key
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">API Keys</h5>
                <Button variant="outline-primary" size="sm" onClick={fetchApiKeys}>
                  <i className="bi bi-arrow-clockwise"></i> Làm mới
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Đang tải danh sách API keys...</p>
                </div>
              ) : apiKeys.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Dịch vụ</th>
                      <th>Key</th>
                      <th>Trạng thái</th>
                      <th>Lượt sử dụng</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(apiKey => (
                      <tr key={apiKey.id}>
                        <td>{apiKey.name}</td>
                        <td>
                          <Badge bg={getServiceColor(apiKey.service)} className="text-white">
                            {getServiceIcon(apiKey.service)} {apiKey.service.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <code>{apiKey.key}</code>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 ms-2"
                            onClick={() => viewKey(apiKey)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                        </td>
                        <td>
                          <Form.Check 
                            type="switch"
                            checked={apiKey.status === 'active'}
                            onChange={(e) => toggleKeyStatus(apiKey.id, apiKey.status)}
                            label={apiKey.status === 'active' ? "Đang hoạt động" : "Vô hiệu hóa"}
                          />
                        </td>
                        <td>{apiKey.usage_count}</td>
                        <td>
                          <Button variant="outline-danger" size="sm" onClick={() => deleteKey(apiKey.id)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p>Không có API key nào. Hãy thêm API key mới để bắt đầu.</p>
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    Thêm API Key
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Kiểm tra kết nối</h5>
            </Card.Header>
            <Card.Body>
              <p>Kiểm tra kết nối đến các API dịch vụ</p>
              <Button 
                variant="primary" 
                className="w-100"
                onClick={testApiConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    {' '}Đang kiểm tra...
                  </>
                ) : 'Kiểm tra tất cả API'}
              </Button>

              {testResults && !testResults.error && (
                <div className="mt-4">
                  <h6>Kết quả kiểm tra:</h6>
                  <ul className="list-group">
                    {Object.entries(testResults).map(([service, result]: [string, any]) => (
                      <li key={service} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <span className="me-2">{getServiceIcon(service)}</span>
                          <strong className="text-capitalize">{service}</strong>
                          <p className="mb-0 small">{result.message}</p>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(result.status)}
                          {result.latency && <div className="small">{result.latency}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {testResults && testResults.error && (
                <Alert variant="danger" className="mt-3">
                  {testResults.error}
                </Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">Thông tin sử dụng</h5>
            </Card.Header>
            <Card.Body>
              <p>Theo dõi chi tiết việc sử dụng API và token</p>
              <Link href="/admin/token-usage" passHref>
                <Button variant="outline-primary" className="w-100">
                  Xem thống kê chi tiết
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal thêm API key mới */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm API Key mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập tên để nhận diện API key này"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Form.Text muted>
                Ví dụ: "Gemini API Production", "OpenAI Testing"
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dịch vụ</Form.Label>
              <Form.Select 
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
              >
                <option value="google">Google (Gemini)</option>
                <option value="openai">OpenAI</option>
                <option value="huggingface">Hugging Face</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Nhập API key"
                value={formData.key}
                onChange={(e) => setFormData({...formData, key: e.target.value})}
              />
              <Form.Text muted>
                API key sẽ được mã hóa trước khi lưu vào cơ sở dữ liệu.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddKey}
            disabled={!formData.key || !formData.name}
          >
            Thêm API Key
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal xem chi tiết API key */}
      <Modal show={showKeyModal} onHide={() => setShowKeyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedKey?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedKey && (
            <>
              <p><strong>Dịch vụ:</strong> {getServiceIcon(selectedKey.service)} {selectedKey.service.toUpperCase()}</p>
              <p><strong>API Key:</strong></p>
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  value={selectedKey.key}
                  readOnly
                />
                <Button variant="outline-secondary">
                  <i className="bi bi-clipboard"></i>
                </Button>
              </InputGroup>
              <p><strong>Trạng thái:</strong> {selectedKey.status === 'active' ? 'Đang hoạt động' : 'Vô hiệu hóa'}</p>
              <p><strong>Ngày tạo:</strong> {new Date(selectedKey.created_at).toLocaleString()}</p>
              {selectedKey.last_used && (
                <p><strong>Lần sử dụng cuối:</strong> {new Date(selectedKey.last_used).toLocaleString()}</p>
              )}
              <p><strong>Lượt sử dụng:</strong> {selectedKey.usage_count}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKeyModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApiManagement;
