# 🚀 Skeleton Loading + JSON Streaming Guide

## 📖 Tổng quan

Kỹ thuật **Skeleton Loading + JSON Streaming** là một phương pháp nâng cao để cải thiện trải nghiệm người dùng (UX) bằng cách:

1. **Hiển thị ngay lập tức** skeleton UI thay vì loading spinner
2. **Stream dữ liệu JSON** từ AI theo từng phần (JSONL format)
3. **Lấp đầy progressive** dữ liệu vào skeleton khi nhận được

## 🎯 Lợi ích

- ⚡ **Tốc độ cảm nhận nhanh hơn**: Người dùng thấy giao diện ngay lập tức
- 🎨 **UX mượt mà**: Không có màn hình trống hay loading spinner gây gián đoạn
- 🔄 **Progressive Loading**: Dữ liệu xuất hiện từng phần một cách tự nhiên
- 🚀 **Hiệu suất cao**: Tận dụng tối đa tốc độ streaming của AI

## 🏗️ Kiến trúc

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Gemini AI     │
│                 │    │                 │    │                 │
│ 1. Show skeleton│───▶│ 2. Stream prompt│───▶│ 3. Generate     │
│ 4. Parse JSONL  │◀───│ 5. Buffer & send│◀───│    JSONL        │
│ 6. Fill skeleton│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Cấu trúc File

```
src/
├── hooks/
│   └── useJSONStreaming.ts          # Custom hook cho streaming
├── components/
│   └── common/
│       └── SkeletonLoader.tsx        # Skeleton components
├── pages/
│   ├── api/
│   │   └── demo/
│   │       ├── stream-products.ts   # API streaming sản phẩm
│   │       └── stream-vocab.ts      # API streaming từ vựng
│   └── demo/
│       ├── index.tsx                # Trang demo chính
│       ├── skeleton-streaming.tsx   # Demo sản phẩm
│       └── vocab-streaming.tsx      # Demo từ vựng
```

## 🔧 Cách triển khai

### 1. Backend - API Streaming

#### Bước 1: Thiết kế Prompt cho JSONL

```typescript
const prompt = `Bạn là một API tìm kiếm sản phẩm. Hãy trả về kết quả dưới dạng một chuỗi các đối tượng JSON, mỗi đối tượng trên một dòng (định dạng JSONL). Không được trả về bất cứ thứ gì khác ngoài chuỗi JSONL này.

Mỗi đối tượng JSON phải đại diện cho một sản phẩm và chứa các key sau: id, tenSP, moTaNgan, gia, urlHinhAnh.

Ví dụ format:
{"id": 1, "tenSP": "Laptop Gaming", "moTaNgan": "Hiệu năng cao", "gia": "25,000,000 VND", "urlHinhAnh": "/images/laptop.jpg"}
{"id": 2, "tenSP": "Mouse Gaming", "moTaNgan": "DPI cao, RGB", "gia": "1,500,000 VND", "urlHinhAnh": "/images/mouse.jpg"}`;
```

#### Bước 2: Xử lý Stream và Buffer

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers cho streaming JSONL
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const result = await model.generateContentStream(prompt);
  let buffer = '';
  
  for await (const chunk of result.stream) {
    buffer += chunk.text();
    
    // Kiểm tra xem có ký tự xuống dòng không
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const completeLine = buffer.substring(0, newlineIndex).trim();
      buffer = buffer.substring(newlineIndex + 1);

      if (completeLine) {
        try {
          JSON.parse(completeLine); // Validate JSON
          res.write(completeLine + '\n'); // Stream to frontend
        } catch (e) {
          console.log('Invalid JSON line:', completeLine);
        }
      }
    }
  }
  
  res.end();
}
```

### 2. Frontend - React Component

#### Bước 1: Sử dụng Custom Hook

```typescript
import { useJSONStreaming } from '../hooks/useJSONStreaming';

const MyComponent = () => {
  const { data, loading, startStream } = useJSONStreaming<ProductType>({
    validateData: (item) => item.tenSP && item.gia,
    onError: (error) => console.error('Streaming error:', error)
  });

  const handleSearch = async () => {
    await startStream('/api/demo/stream-products', { query: 'laptop gaming' });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Hiển thị dữ liệu đã tải */}
      {data.map(item => <ProductCard key={item.id} product={item} />)}
      
      {/* Hiển thị skeleton cho vị trí chưa có dữ liệu */}
      {loading && Array.from({ length: 6 - data.length }).map((_, index) => (
        <ProductCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};
```

#### Bước 2: Manual Streaming (không dùng hook)

```typescript
const startStreaming = async () => {
  setData([]);
  setLoading(true);

  const response = await fetch('/api/demo/stream-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'laptop gaming' }),
  });

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
          const item = JSON.parse(line);
          setData(prev => [...prev, item]);
        } catch (e) {
          console.error('Error parsing JSON line:', line, e);
        }
      }
    }
  }
  
  setLoading(false);
};
```

## 🎨 Skeleton Components

### Sử dụng Skeleton có sẵn

```typescript
import { 
  VocabCardSkeleton, 
  ProductCardSkeleton, 
  SkeletonGrid 
} from '../components/common/SkeletonLoader';

// Hiển thị grid skeleton
<SkeletonGrid count={6} columns={3}>
  <ProductCardSkeleton />
</SkeletonGrid>

// Hoặc manual
{Array.from({ length: 6 }).map((_, index) => (
  <VocabCardSkeleton key={`skeleton-${index}`} />
))}
```

### Tạo Skeleton tùy chỉnh

```typescript
import { Skeleton } from '../components/common/SkeletonLoader';

const CustomSkeleton = () => (
  <div className="bg-white rounded-lg p-4 animate-pulse">
    <Skeleton height="2rem" width="75%" className="mb-2" />
    <Skeleton height="1rem" width="50%" className="mb-4" />
    <Skeleton height="8rem" width="100%" rounded="lg" />
  </div>
);
```

## 📊 Ví dụ thực tế

### 1. Streaming Vocabulary Cards

```typescript
// API: /api/demo/stream-vocab.ts
const prompt = `Tạo ${count} từ vựng về chủ đề "${topic}" với format:
{"id": 1, "word": "example", "meaning": "ví dụ", "example": "This is an example.", "difficulty": 2}`;

// Component: VocabStreamingDemo
const { data: vocabItems, loading, startStream } = useVocabStreaming();

const handleGenerate = () => {
  startStream('/api/demo/stream-vocab', { topic, level, count });
};
```

### 2. Streaming Product List

```typescript
// API: /api/demo/stream-products.ts
const prompt = `Tìm kiếm sản phẩm "${query}" với format:
{"id": 1, "tenSP": "Tên sản phẩm", "gia": "1,000,000 VND", "moTaNgan": "Mô tả"}`;

// Component: ProductStreamingDemo
const { data: products, loading, startStream } = useProductStreaming();
```

## 🔍 Debug và Troubleshooting

### 1. Kiểm tra JSONL Format

```typescript
// Trong API, log để kiểm tra format
console.log('Raw line:', completeLine);
try {
  const parsed = JSON.parse(completeLine);
  console.log('Parsed successfully:', parsed);
} catch (e) {
  console.error('Invalid JSON:', completeLine, e);
}
```

### 2. Kiểm tra Streaming

```typescript
// Trong frontend, log để kiểm tra stream
console.log('Received chunk:', decoder.decode(value));
console.log('Current buffer:', buffer);
console.log('Parsed item:', item);
```

### 3. Common Issues

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|----------|
| Không nhận được data | Headers không đúng | Kiểm tra `Content-Type: application/x-ndjson` |
| JSON parse error | AI trả về format sai | Cải thiện prompt, thêm validation |
| Skeleton không ẩn | Loading state không update | Kiểm tra `setLoading(false)` |
| Stream bị đứt | Network timeout | Thêm error handling và retry |

## 🚀 Performance Tips

1. **Batch Updates**: Thay vì update từng item, có thể batch nhiều items
2. **Debounce**: Debounce việc update UI nếu stream quá nhanh
3. **Memory Management**: Clear data cũ trước khi start stream mới
4. **Error Boundaries**: Wrap component trong Error Boundary

## 📱 Responsive Design

```typescript
// Grid responsive cho skeleton
const gridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
};
```

## 🎬 Live Demos

- **Product Streaming**: `/demo/skeleton-streaming`
- **Vocab Streaming**: `/demo/vocab-streaming`
- **Overview**: `/demo`

## 📚 Tài liệu tham khảo

- [ReadableStream API](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [JSON Lines Format](https://jsonlines.org/)
- [Skeleton Loading Best Practices](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)

---

**Tác giả**: Vocab App Team  
**Cập nhật**: 2024  
**Version**: 1.0.0