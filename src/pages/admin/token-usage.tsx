import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  Container, Row, Col, Card, Button, Spinner, Table,
  Form, Badge, Alert, Tabs, Tab
} from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading sample data in development mode');
        
        // Dữ liệu mẫu cho sử dụng hàng ngày
        const today = new Date();
        const dummyDailyData: TokenUsage[] = Array(30).fill(0).map((_, index) => {
          const date = new Date();
          date.setDate(today.getDate() - index);
          
          // Tạo ngẫu nhiên số lượng token và chi phí
          const tokensIn = Math.floor(Math.random() * 1000) + 500;
          const tokensOut = Math.floor(Math.random() * 500) + 200;
          
          let service = 'google';
          if (index % 4 === 1) service = 'openai';
          if (index % 4 === 2) service = 'huggingface';
          if (index % 4 === 3) service = 'anthropic';
          
          // Tính chi phí dựa trên service và số lượng token (giả lập)
          let costRate = 0;
          if (service === 'google') costRate = 0.0005;
          if (service === 'openai') costRate = 0.001;
          if (service === 'huggingface') costRate = 0.0003;
          if (service === 'anthropic') costRate = 0.0015;
          
          const cost = ((tokensIn * costRate) + (tokensOut * costRate * 1.5));
          
          return {
            date: date.toISOString().split('T')[0],
            service,
            tokensIn,
            tokensOut,
            cost, // Đã là số, không cần chuyển đổi thành chuỗi
            apiCalls: Math.floor(Math.random() * 10) + 1
          };
        });
        
        // Lọc theo service nếu có
        const filteredData = serviceFilter !== 'all' ? dummyDailyData.filter(item => item.service === serviceFilter) : dummyDailyData;
        
        // Lọc theo thời gian
        let timeRangeInDays = 30;
        if (timeRange === '7d') timeRangeInDays = 7;
        if (timeRange === '90d') timeRangeInDays = 90;
        if (timeRange === '180d') timeRangeInDays = 180;
        
        const timeLimitedData = filteredData.slice(0, timeRangeInDays);
        
        setDailyUsage(timeLimitedData);
        
        // Tạo dữ liệu tổng hợp theo tháng
        const months = ['01', '02', '03', '04', '05', '06'];
        const monthlyData: MonthlyUsage[] = months.map(month => {
          const year = new Date().getFullYear();
          
          // Tạo số ngẫu nhiên cho dữ liệu mẫu
          const googleTokensIn = Math.floor(Math.random() * 20000) + 5000;
          const googleTokensOut = Math.floor(Math.random() * 10000) + 2000;
          const googleCost = Math.random() * 40 + 10;
          
          const openaiTokensIn = Math.floor(Math.random() * 15000) + 3000;
          const openaiTokensOut = Math.floor(Math.random() * 7000) + 1000;
          const openaiCost = Math.random() * 30 + 15;
          
          const huggingfaceTokensIn = Math.floor(Math.random() * 10000) + 2000;
          const huggingfaceTokensOut = Math.floor(Math.random() * 5000) + 1000;
          const huggingfaceCost = Math.random() * 20 + 5;
          
          const anthropicTokensIn = Math.floor(Math.random() * 8000) + 1000;
          const anthropicTokensOut = Math.floor(Math.random() * 4000) + 500;
          const anthropicCost = Math.random() * 25 + 10;
          
          // Tính tổng
          const totalTokens = googleTokensIn + googleTokensOut + 
                               openaiTokensIn + openaiTokensOut + 
                               huggingfaceTokensIn + huggingfaceTokensOut + 
                               anthropicTokensIn + anthropicTokensOut;
          
          const totalCost = googleCost + openaiCost + huggingfaceCost + anthropicCost;
          
          return {
            month: `${year}-${month}`,
            totalTokens,
            totalCost,
            services: {
              google: {
                tokensIn: googleTokensIn,
                tokensOut: googleTokensOut,
                cost: googleCost
              },
              openai: {
                tokensIn: openaiTokensIn,
                tokensOut: openaiTokensOut,
                cost: openaiCost
              },
              huggingface: {
                tokensIn: huggingfaceTokensIn,
                tokensOut: huggingfaceTokensOut,
                cost: huggingfaceCost
              },
              anthropic: {
                tokensIn: anthropicTokensIn,
                tokensOut: anthropicTokensOut,
                cost: anthropicCost
              }
            }
          };
        });
        
        setMonthlyUsage(monthlyData);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching token usage data:', err);
      setError('Không thể tải dữ liệu sử dụng token. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };
  
  const getServiceBadge = (service: string) => {
    const colors: Record<string, string> = {
      google: 'primary',
      openai: 'success',
      huggingface: 'info',
      anthropic: 'secondary'
    };
    
    const icons: Record<string, string> = {
      google: '🌀',
      openai: '🤖',
      huggingface: '🤗',
      anthropic: '🧠'
    };
    
    return (
      <Badge bg={colors[service] || 'dark'} className="text-white">
        {icons[service] || '🔑'} {service.toUpperCase()}
      </Badge>
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
          <h1>Thống kê Sử dụng Token</h1>
          <p className="text-muted">Theo dõi chi phí và lượng token đã sử dụng</p>
        </div>
        <div>
          <Button variant="outline-secondary" onClick={() => router.push('/admin')} className="me-2">
            Quay lại Dashboard
          </Button>
          <Button variant="primary" onClick={fetchTokenUsage}>
            Làm mới
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Khoảng thời gian</Form.Label>
                    <Form.Select 
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                    >
                      <option value="day">Hôm nay</option>
                      <option value="week">7 ngày qua</option>
                      <option value="month">30 ngày qua</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Dịch vụ</Form.Label>
                    <Form.Select 
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                    >
                      <option value="all">Tất cả dịch vụ</option>
                      <option value="google">Google (Gemini)</option>
                      <option value="openai">OpenAI</option>
                      <option value="huggingface">Hugging Face</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Đang tải dữ liệu thống kê...</p>
        </div>
      ) : (
        <>
          <Tabs defaultActiveKey="usage" className="mb-4">
            <Tab eventKey="usage" title="Sử dụng Chi tiết">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Sử dụng Token Theo Ngày</h5>
                </Card.Header>
                <Card.Body>
                  {dailyUsage.length > 0 ? (
                    <Table responsive hover striped>
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Dịch vụ</th>
                          <th>Tokens (In)</th>
                          <th>Tokens (Out)</th>
                          <th>Tổng Token</th>
                          <th>Chi phí (USD)</th>
                          <th>API Calls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyUsage.map((item, index) => (
                          <tr key={index}>
                            <td>{item.date}</td>
                            <td>{getServiceBadge(item.service)}</td>
                            <td>{formatNumber(item.tokensIn)}</td>
                            <td>{formatNumber(item.tokensOut)}</td>
                            <td>{formatNumber(item.tokensIn + item.tokensOut)}</td>
                            <td>{formatCurrency(item.cost)}</td>
                            <td>{item.apiCalls}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-group-divider">
                        <tr className="fw-bold">
                          <td colSpan={2}>Tổng cộng</td>
                          <td>{formatNumber(calculateTotals().tokensIn)}</td>
                          <td>{formatNumber(calculateTotals().tokensOut)}</td>
                          <td>{formatNumber(calculateTotals().tokensIn + calculateTotals().tokensOut)}</td>
                          <td>{formatCurrency(calculateTotals().cost)}</td>
                          <td>{calculateTotals().apiCalls}</td>
                        </tr>
                      </tfoot>
                    </Table>
                  ) : (
                    <p className="text-center py-4">Không có dữ liệu cho khoảng thời gian và dịch vụ đã chọn.</p>
                  )}
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="monthly" title="Báo cáo Tháng">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Tổng hợp theo tháng</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Tháng</th>
                        <th>Tổng Token</th>
                        <th>Gemini</th>
                        <th>OpenAI</th>
                        <th>Hugging Face</th>
                        <th>Claude</th>
                        <th>Tổng chi phí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyUsage.map((item, index) => (
                        <tr key={index}>
                          <td>{item.month}</td>
                          <td>{formatNumber(item.totalTokens)}</td>
                          <td>
                            {formatNumber(item.services.google.tokensIn + item.services.google.tokensOut)}
                            <div className="text-muted small">
                              {formatCurrency(item.services.google.cost)}
                            </div>
                          </td>
                          <td>
                            {formatNumber(item.services.openai.tokensIn + item.services.openai.tokensOut)}
                            <div className="text-muted small">
                              {formatCurrency(item.services.openai.cost)}
                            </div>
                          </td>
                          <td>
                            {formatNumber(item.services.huggingface.tokensIn + item.services.huggingface.tokensOut)}
                            <div className="text-muted small">
                              {formatCurrency(item.services.huggingface.cost)}
                            </div>
                          </td>
                          <td>
                            {formatNumber(item.services.anthropic.tokensIn + item.services.anthropic.tokensOut)}
                            <div className="text-muted small">
                              {formatCurrency(item.services.anthropic.cost)}
                            </div>
                          </td>
                          <td className="fw-bold">{formatCurrency(item.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="comparison" title="So sánh Chi phí">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">So sánh Chi phí giữa các Dịch vụ</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-4">Bảng so sánh chi phí sử dụng token giữa các nhà cung cấp API AI:</p>
                  
                  <Table bordered>
                    <thead className="table-light">
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Mô hình</th>
                        <th>Giá Token Đầu vào</th>
                        <th>Giá Token Đầu ra</th>
                        <th>Độ chính xác</th>
                        <th>Tính năng đặc biệt</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <Badge bg="primary" className="text-white">Google Gemini</Badge>
                        </td>
                        <td>
                          <div>Gemini Pro</div>
                          <div>Gemini Flash</div>
                        </td>
                        <td>
                          <div>$0.00025 / 1K tokens</div>
                          <div>$0.0001 / 1K tokens</div>
                        </td>
                        <td>
                          <div>$0.0005 / 1K tokens</div>
                          <div>$0.0002 / 1K tokens</div>
                        </td>
                        <td>Cao</td>
                        <td>Multimodal, cửa sổ ngữ cảnh lớn</td>
                      </tr>
                      <tr>
                        <td>
                          <Badge bg="success" className="text-white">OpenAI</Badge>
                        </td>
                        <td>
                          <div>GPT-4 Turbo</div>
                          <div>GPT-3.5 Turbo</div>
                        </td>
                        <td>
                          <div>$0.01 / 1K tokens</div>
                          <div>$0.0005 / 1K tokens</div>
                        </td>
                        <td>
                          <div>$0.03 / 1K tokens</div>
                          <div>$0.0015 / 1K tokens</div>
                        </td>
                        <td>Rất cao</td>
                        <td>Vision, DALL-E, fine-tuning</td>
                      </tr>
                      <tr>
                        <td>
                          <Badge bg="secondary" className="text-white">Anthropic</Badge>
                        </td>
                        <td>
                          <div>Claude 3 Opus</div>
                          <div>Claude 3 Haiku</div>
                        </td>
                        <td>
                          <div>$0.015 / 1K tokens</div>
                          <div>$0.00025 / 1K tokens</div>
                        </td>
                        <td>
                          <div>$0.075 / 1K tokens</div>
                          <div>$0.00125 / 1K tokens</div>
                        </td>
                        <td>Rất cao</td>
                        <td>Chất lượng văn bản cao, cửa sổ ngữ cảnh 200K tokens</td>
                      </tr>
                      <tr>
                        <td>
                          <Badge bg="info" className="text-white">Hugging Face</Badge>
                        </td>
                        <td>
                          <div>Mixtral 8x7B</div>
                          <div>Llama 2</div>
                        </td>
                        <td colSpan={2}>
                          <div>$0.0002 / 1K tokens (hoặc tự host)</div>
                          <div>Miễn phí hoặc theo chi phí infrastructure</div>
                        </td>
                        <td>Trung bình - Cao</td>
                        <td>Mô hình mã nguồn mở, self-hosting, tùy chỉnh cao</td>
                      </tr>
                    </tbody>
                  </Table>
                  
                  <Alert variant="info" className="mt-4">
                    <h6>Tips tiết kiệm chi phí:</h6>
                    <ul className="mb-0">
                      <li>Sử dụng Gemini Flash cho các tác vụ đơn giản</li>
                      <li>Dùng Claude 3 Haiku cho những tác vụ cần cửa sổ ngữ cảnh lớn</li>
                      <li>Xem xét self-hosting với mô hình mã nguồn mở như Mixtral cho khối lượng cao</li>
                      <li>Tối ưu hóa prompt để giảm lượng token</li>
                    </ul>
                  </Alert>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
          
          <Row className="mt-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h5>Dự báo Chi phí</h5>
                  <p>Dựa trên dữ liệu hiện tại, chi phí ước tính cho tháng này:</p>
                  <h3 className="text-primary">{formatCurrency(calculateTotals().cost * 3)}</h3>
                  <p className="text-muted mb-0">
                    Dự báo này được tính dựa trên xu hướng sử dụng hiện tại. Cài đặt cảnh báo chi phí trong trang Cài đặt.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default TokenUsagePage;
