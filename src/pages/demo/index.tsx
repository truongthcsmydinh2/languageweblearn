import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

// Simple UI Components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled = false, className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const Badge = ({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary';
}) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800'
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

// Simple Icons
const ShoppingCart = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const BookOpen = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const GraduationCap = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
  </svg>
);

const Zap = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
  </svg>
);

const Code = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="16,18 22,12 16,6"></polyline>
    <polyline points="8,6 2,12 8,18"></polyline>
  </svg>
);

const Layers = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="12,2 2,7 12,12 22,7 12,2"></polygon>
    <polyline points="2,17 12,22 22,17"></polyline>
    <polyline points="2,12 12,17 22,12"></polyline>
  </svg>
);

const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12,5 19,12 12,19"></polyline>
  </svg>
);

// Simple Skeleton Components
const VocabCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
  </div>
);

const ProductCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
  </div>
);

const ListItemSkeleton = () => (
  <div className="flex items-center space-x-3 p-3">
    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr>
    <td className="p-3"><div className="h-3 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="p-3"><div className="h-3 bg-gray-200 rounded animate-pulse"></div></td>
    <td className="p-3"><div className="h-3 bg-gray-200 rounded animate-pulse"></div></td>
  </tr>
);

const ButtonSkeleton = () => (
  <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
);

const CardHeaderSkeleton = () => (
  <div className="space-y-2">
    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
  </div>
);

const TextBlockSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }, (_, i) => (
      <div key={i} className={`h-3 bg-gray-200 rounded animate-pulse ${i === lines - 1 ? 'w-2/3' : ''}`}></div>
    ))}
  </div>
);

const AvatarTextSkeleton = () => (
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
      <div className="h-2 bg-gray-200 rounded animate-pulse w-16"></div>
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
  </div>
);

const SkeletonGrid = ({ count = 6, children }: { count?: number; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i}>{children}</div>
    ))}
  </div>
);

const DemoIndexPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            🚀 Skeleton Loading + Streaming Demo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Khám phá các kỹ thuật nâng cao để cải thiện trải nghiệm người dùng
          </p>
          
          {/* Quick Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/demo/skeleton-streaming" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              🛍️ Product Streaming
            </Link>
            <Link href="/demo/vocab-streaming" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              📚 Vocab Streaming
            </Link>
          </div>
        </div>

        {/* Concept Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">💡 Ý tưởng cốt lõi</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant UI</h3>
              <p className="text-gray-600">
                Hiển thị ngay lập tức skeleton UI thay vì loading spinner trống trơn
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">JSON Streaming</h3>
              <p className="text-gray-600">
                Sử dụng JSONL format để stream dữ liệu từ AI theo từng phần
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Progressive Fill</h3>
              <p className="text-gray-600">
                Lấp đầy dữ liệu vào skeleton ngay khi nhận được từ stream
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <h4 className="font-semibold text-lg mb-3">🎯 Kết quả:</h4>
            <p className="text-gray-700">
              Người dùng thấy ngay giao diện hoàn chỉnh, sau đó từng phần dữ liệu xuất hiện mượt mà. 
              Không còn màn hình trống hay loading spinner làm gián đoạn trải nghiệm.
            </p>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🔧 Cách triển khai</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Backend */}
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-4">⚙️ Backend (API)</h3>
              <div className="bg-gray-900 rounded-lg p-4 text-white text-sm mb-4">
                <pre>{`// Prompt AI trả về JSONL format
const prompt = \`
Trả về dữ liệu dưới dạng JSONL:
{"id": 1, "name": "Item 1"}
{"id": 2, "name": "Item 2"}
\`;

// Stream processing
let buffer = '';
for await (const chunk of result.stream) {
  buffer += chunk.text();
  
  while ((newlineIndex = buffer.indexOf('\\n')) !== -1) {
    const line = buffer.substring(0, newlineIndex);
    JSON.parse(line); // Validate
    res.write(line + '\\n'); // Send to frontend
    buffer = buffer.substring(newlineIndex + 1);
  }
}`}</pre>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Prompt AI trả về định dạng JSONL</li>
                <li>✅ Buffer và parse từng dòng JSON</li>
                <li>✅ Validate trước khi gửi</li>
                <li>✅ Stream ngay khi có dữ liệu</li>
              </ul>
            </div>
            
            {/* Frontend */}
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">🎨 Frontend (React)</h3>
              <div className="bg-gray-900 rounded-lg p-4 text-white text-sm mb-4">
                <pre>{`// Streaming reader
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  
  // Parse từng dòng JSON
  while ((newlineIndex = buffer.indexOf('\\n')) !== -1) {
    const line = buffer.substring(0, newlineIndex);
    const item = JSON.parse(line);
    setData(prev => [...prev, item]); // Add to state
    buffer = buffer.substring(newlineIndex + 1);
  }
}`}</pre>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Hiển thị skeleton ngay lập tức</li>
                <li>✅ ReadableStream API</li>
                <li>✅ Parse từng dòng JSON</li>
                <li>✅ Update UI progressive</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Skeleton Components Showcase */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🎨 Skeleton Components</h2>
          <p className="text-center text-gray-600 mb-8">
            Các component skeleton có sẵn trong hệ thống
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Vocab Card Skeleton */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📚 Vocab Card Skeleton</h3>
              <VocabCardSkeleton />
            </div>
            
            {/* Product Card Skeleton */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🛍️ Product Card Skeleton</h3>
              <ProductCardSkeleton />
            </div>
            
            {/* Stats Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📊 Stats Card Skeleton</h3>
              <StatsCardSkeleton />
            </div>
            
            {/* List Items */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📋 List Item Skeleton</h3>
              <div className="space-y-2">
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </div>
            </div>
            
            {/* Text Block */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📝 Text Block Skeleton</h3>
              <TextBlockSkeleton lines={4} />
            </div>
            
            {/* Avatar Text */}
            <div>
              <h3 className="text-lg font-semibold mb-4">👤 Avatar Text Skeleton</h3>
              <div className="space-y-3">
                <AvatarTextSkeleton />
                <AvatarTextSkeleton />
                <AvatarTextSkeleton />
              </div>
            </div>
          </div>
        </div>

        {/* Live Demos */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🎬 Live Demos</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Product Demo */}
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛍️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Product Streaming</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Demo streaming danh sách sản phẩm với skeleton loading
                </p>
              </div>
              
              <div className="mb-4">
                <ProductCardSkeleton />
              </div>
              
              <Link 
                href="/demo/skeleton-streaming"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 rounded-lg font-medium transition-colors"
              >
                🚀 Xem Demo
              </Link>
            </div>
            
            {/* Vocab Demo */}
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Vocab Streaming</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Demo streaming từ vựng tiếng Anh với skeleton loading
                </p>
              </div>
              
              <div className="mb-4">
                <VocabCardSkeleton />
              </div>
              
              <Link 
                href="/demo/vocab-streaming"
                className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-lg font-medium transition-colors"
              >
                🚀 Xem Demo
              </Link>
            </div>
            
            {/* Learning API Demo */}
            <div className="border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Learning API Streaming</h3>
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-2">Mới</span>
                <p className="text-gray-600 text-sm mb-4">
                  Demo skeleton streaming cho các API học từ vựng: khởi tạo, đánh giá câu tự đặt và bản dịch
                </p>
              </div>
              
              <div className="mb-4">
                <VocabCardSkeleton />
              </div>
              
              <Link 
                href="/demo/learning-skeleton"
                className="block w-full bg-purple-500 hover:bg-purple-600 text-white text-center py-3 rounded-lg font-medium transition-colors"
              >
                🚀 Xem Demo Learning API
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🎯 Lợi ích của kỹ thuật này</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="font-semibold mb-2">Tốc độ cảm nhận</h3>
              <p className="text-sm text-gray-600">Người dùng thấy giao diện ngay lập tức</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎨</span>
              </div>
              <h3 className="font-semibold mb-2">UX mượt mà</h3>
              <p className="text-sm text-gray-600">Không có màn hình trống hay loading spinner</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🔄</span>
              </div>
              <h3 className="font-semibold mb-2">Progressive Loading</h3>
              <p className="text-sm text-gray-600">Dữ liệu xuất hiện từng phần một cách tự nhiên</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="font-semibold mb-2">Hiệu suất cao</h3>
              <p className="text-sm text-gray-600">Tận dụng tối đa tốc độ streaming của AI</p>
            </div>
          </div>
        </div>

        {/* Code Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">📁 Code Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🎣 Custom Hooks</h3>
              <p className="text-gray-600 text-sm mb-3">
                Hook tái sử dụng cho JSON streaming
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                /src/hooks/useJSONStreaming.ts
              </code>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🎨 Skeleton Components</h3>
              <p className="text-gray-600 text-sm mb-3">
                Các component skeleton có sẵn
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                /src/components/common/SkeletonLoader.tsx
              </code>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">⚙️ API Examples</h3>
              <p className="text-gray-600 text-sm mb-3">
                Ví dụ API streaming JSONL
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                /src/pages/api/demo/
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoIndexPage;