import React, { useState } from 'react';
import { NextPage } from 'next';

interface Product {
  id: number;
  tenSP: string;
  moTaNgan: string;
  gia: string;
  urlHinhAnh: string;
}

const SkeletonCard = () => (
  <div className="bg-gray-700 rounded-lg shadow-md p-6 animate-pulse">
    <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
    <div className="h-6 bg-gray-300 rounded mb-2"></div>
    <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
    <div className="h-5 bg-gray-300 rounded w-1/2"></div>
  </div>
);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <div className="bg-gray-700 rounded-lg shadow-md p-6 transform transition-all duration-500 hover:scale-105">
    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
      <span className="text-gray-500 text-sm">📦 {product.tenSP}</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.tenSP}</h3>
    <p className="text-gray-600 text-sm mb-3">{product.moTaNgan}</p>
    <div className="flex justify-between items-center">
      <span className="text-xl font-bold text-green-600">{product.gia}</span>
      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
        Mua ngay
      </button>
    </div>
  </div>
);

const SkeletonStreamingDemo: NextPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('laptop gaming');
  const [skeletonCount] = useState(5); // Số skeleton cards hiển thị

  const startStreaming = async () => {
    setProducts([]);
    setLoading(true);

    try {
      const response = await fetch('/api/demo/stream-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Xử lý từng dòng JSON hoàn chỉnh
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, newlineIndex).trim();
          buffer = buffer.substring(newlineIndex + 1);

          if (line) {
            try {
              const product: Product = JSON.parse(line);
              setProducts(prev => [...prev, product]);
            } catch (e) {
              console.error('Error parsing JSON line:', line, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Demo Skeleton Loading + JSON Streaming
          </h1>
          <p className="text-gray-600 mb-6">
            Trải nghiệm tải dữ liệu mượt mà với skeleton loading và streaming JSON
          </p>
          
          {/* Search Input */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={startStreaming}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? '🔄 Đang tải...' : '🔍 Tìm kiếm'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-4 bg-gray-700 rounded-lg px-6 py-3 shadow-sm">
            <span className="text-sm text-gray-600">
              📊 Đã tải: <span className="font-semibold text-blue-600">{products.length}</span> sản phẩm
            </span>
            {loading && (
              <span className="text-sm text-orange-600">
                ⏳ Đang streaming...
              </span>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Hiển thị sản phẩm đã tải */}
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {/* Hiển thị skeleton cho các vị trí chưa có dữ liệu */}
          {loading && Array.from({ length: skeletonCount - products.length }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
          ))}
        </div>

        {/* Hướng dẫn */}
        <div className="mt-12 bg-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">💡 Cách hoạt động:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">🎨 Frontend (React):</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hiển thị ngay skeleton cards (khung xương)</li>
                <li>• Sử dụng fetch() với ReadableStream</li>
                <li>• Parse từng dòng JSON khi nhận được</li>
                <li>• Thay thế skeleton bằng dữ liệu thật</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-green-600 mb-2">⚙️ Backend (API):</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Prompt AI trả về định dạng JSONL</li>
                <li>• Stream từng chunk từ Gemini</li>
                <li>• Buffer và parse từng dòng JSON</li>
                <li>• Gửi về frontend ngay khi có dữ liệu</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">📝 Key Code Snippets:</h3>
          <div className="text-sm space-y-4">
            <div>
              <div className="text-blue-300 mb-2">Frontend - Streaming Reader:</div>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // Parse từng dòng JSON...
  const product = JSON.parse(line);
  setProducts(prev => [...prev, product]);
}`}
              </pre>
            </div>
            <div>
              <div className="text-green-300 mb-2">Backend - JSONL Streaming:</div>
              <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`for await (const chunk of result.stream) {
  buffer += chunk.text();
  while ((newlineIndex = buffer.indexOf('\\n')) !== -1) {
    const line = buffer.substring(0, newlineIndex);
    JSON.parse(line); // Validate
    res.write(line + '\\n'); // Stream to frontend
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonStreamingDemo;