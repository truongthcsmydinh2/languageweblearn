import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  Container, Row, Col, Card, Button, Form, Spinner, Alert, Tabs, Tab
} from 'react-bootstrap';

interface ApiSettings {
  defaultModel: string;
  maxTokenLimit: number;
  dailyQuota: number;
  fallbackProvider: string;
  enableCaching: boolean;
  cacheTTL: number;
}

interface NotificationSettings {
  emailAlerts: boolean;
  costThreshold: number;
  dailyReports: boolean;
  errorNotifications: boolean;
  adminEmails: string[];
}

interface SecuritySettings {
  requireAdminApproval: boolean;
  apiKeyRotationDays: number;
  rateLimit: number;
  ipWhitelist: string[];
}

const SettingsPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    defaultModel: 'gemini-1.5-flash',
    maxTokenLimit: 10000,
    dailyQuota: 500000,
    fallbackProvider: 'huggingface',
    enableCaching: true,
    cacheTTL: 24
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    costThreshold: 5,
    dailyReports: false,
    errorNotifications: true,
    adminEmails: ['admin@example.com']
  });
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    requireAdminApproval: true,
    apiKeyRotationDays: 90,
    rateLimit: 60,
    ipWhitelist: []
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      fetchSettings();
    }
  }, [user, loading, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Giả lập API call - thay thế bằng API call thật trong production
      // const response = await fetch('/api/admin/settings');
      // const data = await response.json();
      
      // Dữ liệu mẫu để hiển thị UI
      setTimeout(() => {
        // Dữ liệu đã mặc định trong useState
        setIsLoading(false);
      }, 800);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Không thể tải cài đặt. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  const handleApiSettingsChange = (field: keyof ApiSettings, value: any) => {
    setApiSettings({
      ...apiSettings,
      [field]: value
    });
  };

  const handleNotificationSettingsChange = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings({
      ...notificationSettings,
      [field]: value
    });
  };

  const handleSecuritySettingsChange = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings({
      ...securitySettings,
      [field]: value
    });
  };

  const handleAddAdminEmail = (email: string) => {
    if (!email || notificationSettings.adminEmails.includes(email)) return;
    
    setNotificationSettings({
      ...notificationSettings,
      adminEmails: [...notificationSettings.adminEmails, email]
    });
  };

  const handleRemoveAdminEmail = (email: string) => {
    setNotificationSettings({
      ...notificationSettings,
      adminEmails: notificationSettings.adminEmails.filter(e => e !== email)
    });
  };

  const handleAddIpWhitelist = (ip: string) => {
    if (!ip || securitySettings.ipWhitelist.includes(ip)) return;
    
    setSecuritySettings({
      ...securitySettings,
      ipWhitelist: [...securitySettings.ipWhitelist, ip]
    });
  };

  const handleRemoveIpWhitelist = (ip: string) => {
    setSecuritySettings({
      ...securitySettings,
      ipWhitelist: securitySettings.ipWhitelist.filter(i => i !== ip)
    });
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Giả lập API call - thay thế bằng API call thật trong production
      // const response = await fetch('/api/admin/settings', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     apiSettings,
      //     notificationSettings,
      //     securitySettings
      //   })
      // });
      // const data = await response.json();
      
      // Giả lập thành công
      setTimeout(() => {
        setSuccessMessage('Cài đặt đã được lưu thành công.');
        setIsSaving(false);
      }, 1000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Không thể lưu cài đặt. Vui lòng thử lại sau.');
      setIsSaving(false);
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
          <h1>Cài đặt Hệ thống</h1>
          <p className="text-muted">Quản lý cài đặt và cấu hình cho ứng dụng</p>
        </div>
        <div>
          <Button variant="outline-secondary" onClick={() => router.push('/admin')} className="me-2">
            Quay lại Dashboard
          </Button>
          <Button 
            variant="primary" 
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                {' '}Đang lưu...
              </>
            ) : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Đang tải cài đặt hệ thống...</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="api" className="mb-4">
          <Tab eventKey="api" title="Cài đặt API">
            <Card>
              <Card.Body>
                <h4 className="mb-4">Cài đặt Dịch vụ API</h4>
                
                <Form>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Mô hình mặc định</Form.Label>
                        <Form.Select 
                          value={apiSettings.defaultModel}
                          onChange={(e) => handleApiSettingsChange('defaultModel', e.target.value)}
                        >
                          <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                          <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                          <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
                          <option value="gpt-4-turbo">OpenAI GPT-4 Turbo</option>
                          <option value="claude-3-haiku">Anthropic Claude 3 Haiku</option>
                          <option value="mixtral-8x7b">Hugging Face Mixtral 8x7B</option>
                        </Form.Select>
                        <Form.Text muted>
                          Mô hình mặc định sẽ được sử dụng nếu không có mô hình nào được chỉ định.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Nhà cung cấp dự phòng</Form.Label>
                        <Form.Select 
                          value={apiSettings.fallbackProvider}
                          onChange={(e) => handleApiSettingsChange('fallbackProvider', e.target.value)}
                        >
                          <option value="none">Không có</option>
                          <option value="google">Google (Gemini)</option>
                          <option value="openai">OpenAI</option>
                          <option value="huggingface">Hugging Face</option>
                          <option value="anthropic">Anthropic (Claude)</option>
                        </Form.Select>
                        <Form.Text muted>
                          Nhà cung cấp dự phòng sẽ được sử dụng khi nhà cung cấp chính gặp lỗi.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Giới hạn token tối đa mỗi yêu cầu</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={apiSettings.maxTokenLimit}
                          onChange={(e) => handleApiSettingsChange('maxTokenLimit', parseInt(e.target.value))}
                        />
                        <Form.Text muted>
                          Số lượng token tối đa cho mỗi yêu cầu API (input + output).
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Hạn mức token hàng ngày</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={apiSettings.dailyQuota}
                          onChange={(e) => handleApiSettingsChange('dailyQuota', parseInt(e.target.value))}
                        />
                        <Form.Text muted>
                          Giới hạn số lượng token có thể sử dụng trong một ngày.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Bật bộ nhớ đệm</Form.Label>
                        <Form.Check 
                          type="switch"
                          label="Lưu cache kết quả API để giảm chi phí"
                          checked={apiSettings.enableCaching}
                          onChange={(e) => handleApiSettingsChange('enableCaching', e.target.checked)}
                        />
                        <Form.Text muted>
                          Lưu cache kết quả API để tái sử dụng cho các yêu cầu giống nhau.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Thời gian lưu cache (giờ)</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={apiSettings.cacheTTL}
                          onChange={(e) => handleApiSettingsChange('cacheTTL', parseInt(e.target.value))}
                          disabled={!apiSettings.enableCaching}
                        />
                        <Form.Text muted>
                          Thời gian lưu trữ kết quả trong bộ nhớ đệm (tính bằng giờ).
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="notifications" title="Thông báo">
            <Card>
              <Card.Body>
                <h4 className="mb-4">Cài đặt Thông báo</h4>
                
                <Form>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Cảnh báo qua email</Form.Label>
                        <Form.Check 
                          type="switch"
                          label="Gửi cảnh báo qua email khi vượt ngưỡng chi phí"
                          checked={notificationSettings.emailAlerts}
                          onChange={(e) => handleNotificationSettingsChange('emailAlerts', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Ngưỡng chi phí (USD)</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={notificationSettings.costThreshold}
                          onChange={(e) => handleNotificationSettingsChange('costThreshold', parseFloat(e.target.value))}
                          disabled={!notificationSettings.emailAlerts}
                        />
                        <Form.Text muted>
                          Gửi cảnh báo khi chi phí hàng ngày vượt quá ngưỡng này.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Báo cáo hàng ngày</Form.Label>
                        <Form.Check 
                          type="switch"
                          label="Gửi báo cáo sử dụng hàng ngày"
                          checked={notificationSettings.dailyReports}
                          onChange={(e) => handleNotificationSettingsChange('dailyReports', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Thông báo lỗi</Form.Label>
                        <Form.Check 
                          type="switch"
                          label="Gửi thông báo khi xảy ra lỗi API"
                          checked={notificationSettings.errorNotifications}
                          onChange={(e) => handleNotificationSettingsChange('errorNotifications', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Email Admin</Form.Label>
                        <div className="d-flex mb-2">
                          <Form.Control 
                            type="email" 
                            id="adminEmail"
                            placeholder="Nhập email admin"
                          />
                          <Button 
                            variant="primary" 
                            className="ms-2"
                            onClick={() => {
                              const input = document.getElementById('adminEmail') as HTMLInputElement;
                              if (input.value) {
                                handleAddAdminEmail(input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Thêm
                          </Button>
                        </div>
                        <Form.Text muted className="mb-2 d-block">
                          Các email sẽ nhận được thông báo và cảnh báo.
                        </Form.Text>
                        
                        <div>
                          {notificationSettings.adminEmails.map((email, index) => (
                            <Button 
                              key={index} 
                              variant="outline-secondary" 
                              size="sm" 
                              className="me-2 mb-2"
                              onClick={() => handleRemoveAdminEmail(email)}
                            >
                              {email} <span className="ms-2">&times;</span>
                            </Button>
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="security" title="Bảo mật">
            <Card>
              <Card.Body>
                <h4 className="mb-4">Cài đặt Bảo mật</h4>
                
                <Form>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Yêu cầu phê duyệt cho API key mới</Form.Label>
                        <Form.Check 
                          type="switch"
                          label="Yêu cầu admin phê duyệt trước khi API key mới có thể sử dụng"
                          checked={securitySettings.requireAdminApproval}
                          onChange={(e) => handleSecuritySettingsChange('requireAdminApproval', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Thời gian luân chuyển API Key (ngày)</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={securitySettings.apiKeyRotationDays}
                          onChange={(e) => handleSecuritySettingsChange('apiKeyRotationDays', parseInt(e.target.value))}
                        />
                        <Form.Text muted>
                          Số ngày trước khi nhắc nhở thay đổi API key.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Giới hạn tốc độ (yêu cầu/phút)</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={securitySettings.rateLimit}
                          onChange={(e) => handleSecuritySettingsChange('rateLimit', parseInt(e.target.value))}
                        />
                        <Form.Text muted>
                          Số lượng yêu cầu API tối đa cho phép trong một phút.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Danh sách IP được phép</Form.Label>
                        <div className="d-flex mb-2">
                          <Form.Control 
                            type="text" 
                            id="ipWhitelist"
                            placeholder="Nhập địa chỉ IP (ví dụ: 192.168.1.1 hoặc 10.0.0.0/24)"
                          />
                          <Button 
                            variant="primary" 
                            className="ms-2"
                            onClick={() => {
                              const input = document.getElementById('ipWhitelist') as HTMLInputElement;
                              if (input.value) {
                                handleAddIpWhitelist(input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Thêm
                          </Button>
                        </div>
                        <Form.Text muted className="mb-2 d-block">
                          Để trống để cho phép tất cả các IP. Thêm địa chỉ IP hoặc dải CIDR để giới hạn truy cập.
                        </Form.Text>
                        
                        <div>
                          {securitySettings.ipWhitelist.length > 0 ? (
                            securitySettings.ipWhitelist.map((ip, index) => (
                              <Button 
                                key={index} 
                                variant="outline-secondary" 
                                size="sm" 
                                className="me-2 mb-2"
                                onClick={() => handleRemoveIpWhitelist(ip)}
                              >
                                {ip} <span className="ms-2">&times;</span>
                              </Button>
                            ))
                          ) : (
                            <span className="text-muted">Không có giới hạn IP (cho phép tất cả)</span>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="backup" title="Sao lưu & Phục hồi">
            <Card>
              <Card.Body>
                <h4 className="mb-4">Sao lưu và Phục hồi Dữ liệu</h4>
                
                <Alert variant="info">
                  Bạn có thể tạo sao lưu của tất cả dữ liệu hệ thống, bao gồm từ vựng, cài đặt người dùng, và thống kê.
                </Alert>
                
                <Row>
                  <Col md={6} className="mb-4">
                    <Card>
                      <Card.Body>
                        <h5>Tạo Sao lưu</h5>
                        <p>Tạo một bản sao lưu đầy đủ của tất cả dữ liệu trong hệ thống.</p>
                        <Button variant="primary">Tạo Sao lưu Mới</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6} className="mb-4">
                    <Card>
                      <Card.Body>
                        <h5>Phục hồi Dữ liệu</h5>
                        <p>Phục hồi dữ liệu từ một bản sao lưu đã tạo trước đây.</p>
                        <Form.Group className="mb-3">
                          <Form.Control type="file" />
                        </Form.Group>
                        <Button variant="warning">Phục hồi</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={12}>
                    <Card>
                      <Card.Header>
                        <h5 className="mb-0">Lịch sử Sao lưu</h5>
                      </Card.Header>
                      <Card.Body>
                        <Table responsive hover>
                          <thead>
                            <tr>
                              <th>Tên</th>
                              <th>Thời gian</th>
                              <th>Kích thước</th>
                              <th>Trạng thái</th>
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>backup-2023-11-01.zip</td>
                              <td>01/11/2023 08:30</td>
                              <td>2.4 MB</td>
                              <td><span className="badge bg-success">Thành công</span></td>
                              <td>
                                <Button variant="outline-primary" size="sm" className="me-2">Tải xuống</Button>
                                <Button variant="outline-danger" size="sm">Xóa</Button>
                              </td>
                            </tr>
                            <tr>
                              <td>backup-2023-10-15.zip</td>
                              <td>15/10/2023 14:22</td>
                              <td>2.1 MB</td>
                              <td><span className="badge bg-success">Thành công</span></td>
                              <td>
                                <Button variant="outline-primary" size="sm" className="me-2">Tải xuống</Button>
                                <Button variant="outline-danger" size="sm">Xóa</Button>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}
      
      <div className="d-flex justify-content-end mt-4">
        <Button variant="outline-secondary" className="me-2" onClick={fetchSettings}>
          Hủy thay đổi
        </Button>
        <Button 
          variant="primary" 
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              {' '}Đang lưu...
            </>
          ) : 'Lưu cài đặt'}
        </Button>
      </div>
    </Container>
  );
};

export default SettingsPage;
