# Hướng Dẫn Tạo Document View Trong Dự Án Vocab App

## 1. Tổng Quan Dự Án

Dự án **Vocab App** là một ứng dụng học từ vựng toàn diện được xây dựng bằng Next.js, TypeScript, và Prisma. Ứng dụng cung cấp nhiều tính năng học tập như học từ vựng, luyện viết với AI, IELTS Reading, và quản lý học tập.

### Công Nghệ Chính
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **AI Integration**: Google Gemini API, Google Translate API
- **Authentication**: Firebase Auth
- **UI Components**: React Bootstrap, Chart.js

## 2. Cấu Trúc Thư Mục Dự Án

```
src/
├── components/           # Các component UI
│   ├── admin/           # Components cho admin
│   ├── auth/            # Components xác thực
│   ├── common/          # Components dùng chung
│   ├── dashboard/       # Components dashboard
│   ├── learning/        # Components học tập
│   ├── vocab/           # Components từ vựng
│   └── user/            # Components người dùng
├── pages/               # Các trang và API routes
│   ├── api/             # API endpoints
│   ├── admin/           # Trang quản trị
│   ├── auth/            # Trang xác thực
│   ├── dashboard/       # Trang dashboard
│   ├── learning/        # Trang học tập
│   └── vocab/           # Trang từ vựng
├── lib/                 # Thư viện và utilities
├── services/            # Logic nghiệp vụ
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── types/               # Định nghĩa TypeScript
└── utils/               # Hàm tiện ích
```

## 2.1. Sơ Đồ Nhánh Cấu Trúc Pages

```mermaid
graph TD
    A[index.tsx - Trang Chủ] --> B[auth/]
    A --> C[dashboard/]
    A --> D[learning/]
    A --> E[vocab/]
    A --> F[admin/]
    A --> G[writingcheck/]
    A --> H[employee/]
    
    B --> B1[signin.tsx - Đăng nhập]
    B --> B2[signup.tsx - Đăng ký]
    
    C --> C1[index.tsx - Dashboard chính]
    
    D --> D1[index.tsx - Trang học tập chính]
    D --> D2[exam.tsx - Thi thử]
    D --> D3[quiz.tsx - Câu hỏi trắc nghiệm]
    D --> D4[review.tsx - Ôn tập]
    D --> D5[smart.tsx - Học thông minh]
    D --> D6[ielts-reading.tsx - IELTS Reading]
    D --> D7[part-of-speech.tsx - Từ loại]
    D --> D8[storytelling/]
    D --> D9[dailydictation/]
    D --> D10[lesson/]
    D --> D11[smart/]
    
    D8 --> D8A[index.tsx - Kể chuyện]
    D8 --> D8B[history.tsx - Lịch sử]
    D8 --> D8C[history/[id].tsx - Chi tiết lịch sử]
    
    D9 --> D9A[index.tsx - Chính tả hàng ngày]
    D9 --> D9B["[id].tsx - Bài chính tả cụ thể"]
    
    D10 --> D10A["[id].tsx - Bài học cụ thể"]
    
    D11 --> D11A[revise.tsx - Ôn tập thông minh]
    
    E --> E1[index.tsx - Danh sách từ vựng]
    E --> E2[add.tsx - Thêm từ vựng]
    E --> E3[sets.tsx - Bộ từ vựng]
    E --> E4["[id].tsx - Chi tiết từ vựng"]
    
    F --> F1[index.tsx - Dashboard admin]
    F --> F2[users.tsx - Quản lý người dùng]
    F --> F3[ielts-reading.tsx - Quản lý IELTS Reading]
    F --> F4[ielts-reading-test.tsx - Test IELTS Reading]
    F --> F5[writinglesson.tsx - Quản lý bài viết]
    F --> F6[dictation.tsx - Quản lý chính tả]
    F --> F7[api-management.tsx - Quản lý API]
    F --> F8[token-usage.tsx - Sử dụng token]
    F --> F9[settings.tsx - Cài đặt hệ thống]
    F --> F10[system-check.tsx - Kiểm tra hệ thống]
    F --> F11[system-monitor.tsx - Giám sát hệ thống]
    F --> F12[assignshift.tsx - Phân ca làm việc]
    F --> F13[update-uid.tsx - Cập nhật UID]
    
    G --> G1[index.tsx - Kiểm tra viết]
    G --> G2[list.tsx - Danh sách bài viết]
    G --> G3[history.tsx - Lịch sử viết]
    G --> G4[test.tsx - Test viết]
    G --> G5[practice/]
    
    G5 --> G5A["[lessonId].tsx - Luyện tập viết"]
    
    H --> H1[shifts.tsx - Ca làm việc]
```

## 2.2. Chi Tiết Chức Năng Từng Page

### 🏠 **Trang Chủ & Xác Thực**
| Page | Chức năng chính |
|------|----------------|
| `index.tsx` | Trang chủ, điều hướng đến dashboard nếu đã đăng nhập |
| `login.tsx` | Form đăng nhập độc lập |
| `register.tsx` | Form đăng ký độc lập |
| `auth/signin.tsx` | Trang đăng nhập với Firebase Auth |
| `auth/signup.tsx` | Trang đăng ký với Firebase Auth |

### 📊 **Dashboard**
| Page | Chức năng chính |
|------|----------------|
| `dashboard/index.tsx` | Tổng quan học tập, thống kê tiến độ, menu điều hướng |

### 📚 **Module Học Tập (Learning)**
| Page | Chức năng chính |
|------|----------------|
| `learning/index.tsx` | Hub học tập chính, lựa chọn loại bài học |
| `learning/exam.tsx` | Thi thử từ vựng, đánh giá năng lực |
| `learning/quiz.tsx` | Câu hỏi trắc nghiệm từ vựng |
| `learning/review.tsx` | Ôn tập từ vựng đã học |
| `learning/smart.tsx` | Học thông minh với AI |
| `learning/smart/revise.tsx` | Ôn tập thông minh dựa trên thuật toán |
| `learning/ielts-reading.tsx` | Luyện đọc IELTS |
| `learning/part-of-speech.tsx` | Học từ loại |
| `learning/lesson/[id].tsx` | Bài học cụ thể theo ID |
| `learning/storytelling/index.tsx` | Tạo và kể chuyện |
| `learning/storytelling/history.tsx` | Lịch sử các câu chuyện |
| `learning/storytelling/history/[id].tsx` | Chi tiết câu chuyện cụ thể |
| `learning/dailydictation/index.tsx` | Danh sách bài chính tả hàng ngày |
| `learning/dailydictation/[id].tsx` | Bài chính tả cụ thể |
| `learning/vocab-example.tsx` | Ví dụ sử dụng từ vựng |
| `learning/vocab-list.tsx` | Danh sách từ vựng để học |
| `learning/vocab-selection.tsx` | Chọn từ vựng để học |
| `learning/example.tsx` | Ví dụ học tập |

### 📖 **Module Từ Vựng (Vocab)**
| Page | Chức năng chính |
|------|----------------|
| `vocab/index.tsx` | Danh sách tất cả từ vựng |
| `vocab/add.tsx` | Thêm từ vựng mới |
| `vocab/sets.tsx` | Quản lý bộ từ vựng |
| `vocab/[id].tsx` | Chi tiết từ vựng cụ thể |

### ✍️ **Module Luyện Viết (Writing Check)**
| Page | Chức năng chính |
|------|----------------|
| `writingcheck/index.tsx` | Trang chính luyện viết |
| `writingcheck/list.tsx` | Danh sách bài viết đã nộp |
| `writingcheck/history.tsx` | Lịch sử luyện viết |
| `writingcheck/test.tsx` | Test tính năng viết |
| `writingcheck/practice/[lessonId].tsx` | Luyện tập viết theo bài học |

### 👨‍💼 **Module Quản Trị (Admin)**
| Page | Chức năng chính |
|------|----------------|
| `admin/index.tsx` | Dashboard quản trị tổng quan |
| `admin/users.tsx` | Quản lý người dùng, phân quyền |
| `admin/ielts-reading.tsx` | Quản lý bài đọc IELTS |
| `admin/ielts-reading-test.tsx` | Test tính năng IELTS Reading |
| `admin/writinglesson.tsx` | Quản lý bài học viết |
| `admin/dictation.tsx` | Quản lý bài chính tả |
| `admin/api-management.tsx` | Quản lý API keys và cấu hình |
| `admin/token-usage.tsx` | Theo dõi sử dụng token AI |
| `admin/settings.tsx` | Cài đặt hệ thống |
| `admin/system-check.tsx` | Kiểm tra tình trạng hệ thống |
| `admin/system-monitor.tsx` | Giám sát hiệu suất hệ thống |
| `admin/assignshift.tsx` | Phân ca làm việc cho nhân viên |
| `admin/update-uid.tsx` | Cập nhật Firebase UID |

### 👥 **Module Nhân Viên (Employee)**
| Page | Chức năng chính |
|------|----------------|
| `employee/shifts.tsx` | Xem ca làm việc được phân công |

### 🧪 **Demo & Test Pages**
| Page | Chức năng chính |
|------|----------------|
| `demo/index.tsx` | Trang demo tổng quan |
| `demo/learning-skeleton.tsx` | Demo skeleton loading |
| `demo/skeleton-streaming.tsx` | Demo streaming skeleton |
| `demo/vocab-streaming.tsx` | Demo streaming từ vựng |
| `test-admin.tsx` | Test quyền admin |
| `firebase-test.tsx` | Test kết nối Firebase |
| `db-check.js` | Kiểm tra kết nối database |

## 3. Cấu Trúc Database (Prisma Schema)

### Models Chính

#### Users
```prisma
model users {
  id          Int      @id @default(autoincrement())
  firebase_uid String  @unique
  email       String   @unique
  name        String?
  role        String   @default("user")
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

#### Vocab Sets
```prisma
model vocab_sets {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  user_id     Int
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

#### Terms
```prisma
model terms {
  id             Int      @id @default(autoincrement())
  term           String
  definition     String
  pronunciation  String?
  part_of_speech String?
  meanings       Json?
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}
```

## 4. Các Tính Năng Chính

### 4.1 Học Từ Vựng
- **Spaced Repetition**: Hệ thống lặp lại có khoảng cách
- **Flashcards**: Thẻ từ vựng tương tác
- **Progress Tracking**: Theo dõi tiến độ học tập

### 4.2 Luyện Viết với AI
- **AI Assessment**: Đánh giá bài viết bằng Google Gemini
- **Error Analysis**: Phân tích lỗi chi tiết
- **Suggestions**: Gợi ý cải thiện

### 4.3 IELTS Reading
- **Passage Management**: Quản lý bài đọc
- **Question Types**: Nhiều loại câu hỏi IELTS
- **Auto Scoring**: Chấm điểm tự động

### 4.4 Dashboard Quản Trị
- **User Management**: Quản lý người dùng
- **Content Management**: Quản lý nội dung
- **Analytics**: Thống kê và báo cáo

## 5. Hướng Dẫn Tạo Document View

### 5.1 Tạo Component Mới

#### Ví Dụ: Tạo VocabDetailView Component

```typescript
// src/components/vocab/VocabDetailView.tsx
import React from 'react';
import { Term } from '@/types/vocab';

interface VocabDetailViewProps {
  term: Term;
  onEdit?: () => void;
  onDelete?: () => void;
}

const VocabDetailView: React.FC<VocabDetailViewProps> = ({ 
  term, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{term.term}</h2>
        <div className="flex space-x-2">
          {onEdit && (
            <button 
              onClick={onEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Chỉnh sửa
            </button>
          )}
          {onDelete && (
            <button 
              onClick={onDelete}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="font-semibold text-gray-600">Định nghĩa:</span>
          <p className="text-gray-800 mt-1">{term.definition}</p>
        </div>
        
        {term.pronunciation && (
          <div>
            <span className="font-semibold text-gray-600">Phát âm:</span>
            <p className="text-gray-800 mt-1">{term.pronunciation}</p>
          </div>
        )}
        
        {term.part_of_speech && (
          <div>
            <span className="font-semibold text-gray-600">Từ loại:</span>
            <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm">
              {term.part_of_speech}
            </span>
          </div>
        )}
        
        {term.meanings && (
          <div>
            <span className="font-semibold text-gray-600">Nghĩa khác:</span>
            <ul className="list-disc list-inside mt-1 text-gray-800">
              {Array.isArray(term.meanings) && term.meanings.map((meaning, index) => (
                <li key={index}>{meaning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabDetailView;
```

### 5.2 Tạo Page Mới

#### Ví Dụ: Tạo Vocab Detail Page

```typescript
// src/pages/vocab/[id].tsx
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import VocabDetailView from '@/components/vocab/VocabDetailView';
import { Term } from '@/types/vocab';
import { prisma } from '@/lib/prisma';

interface VocabDetailPageProps {
  term: Term;
}

const VocabDetailPage: React.FC<VocabDetailPageProps> = ({ term }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    // Logic chỉnh sửa
  };

  const handleDelete = async () => {
    if (confirm('Bạn có chắc muốn xóa từ này?')) {
      try {
        const response = await fetch(`/api/vocab/${term.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          router.push('/vocab');
        }
      } catch (error) {
        console.error('Lỗi khi xóa từ:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <VocabDetailView 
        term={term}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    const term = await prisma.terms.findUnique({
      where: { id: parseInt(id as string) },
    });

    if (!term) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        term: JSON.parse(JSON.stringify(term)),
      },
    };
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu từ:', error);
    return {
      notFound: true,
    };
  }
};

export default VocabDetailPage;
```

### 5.3 Tạo API Endpoint

#### Ví Dụ: API cho Vocab Detail

```typescript
// src/pages/api/vocab/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const termId = parseInt(id as string);

  switch (req.method) {
    case 'GET':
      try {
        const term = await prisma.terms.findUnique({
          where: { id: termId },
        });

        if (!term) {
          return res.status(404).json({ error: 'Không tìm thấy từ' });
        }

        res.status(200).json(term);
      } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
      }
      break;

    case 'PUT':
      try {
        const { term, definition, pronunciation, part_of_speech } = req.body;
        
        const updatedTerm = await prisma.terms.update({
          where: { id: termId },
          data: {
            term,
            definition,
            pronunciation,
            part_of_speech,
            updated_at: new Date(),
          },
        });

        res.status(200).json(updatedTerm);
      } catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật từ' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.terms.delete({
          where: { id: termId },
        });

        res.status(200).json({ message: 'Đã xóa từ thành công' });
      } catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa từ' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

## 6. Best Practices

### 6.1 Component Design
- **Single Responsibility**: Mỗi component chỉ làm một việc
- **Reusability**: Thiết kế component có thể tái sử dụng
- **Props Interface**: Định nghĩa rõ ràng interface cho props
- **Error Handling**: Xử lý lỗi một cách graceful

### 6.2 State Management
- **Local State**: Sử dụng useState cho state component
- **Global State**: Sử dụng Context API cho state toàn cục
- **Server State**: Sử dụng SWR hoặc React Query cho data fetching

### 6.3 Styling
- **Tailwind CSS**: Sử dụng utility classes
- **Responsive Design**: Thiết kế responsive cho mobile
- **Consistent Theme**: Sử dụng theme colors và spacing

### 6.4 Performance
- **Code Splitting**: Chia nhỏ bundle size
- **Lazy Loading**: Load component khi cần thiết
- **Memoization**: Sử dụng React.memo và useMemo

## 7. Ví Dụ Thực Tế Từ Dự Án

### 7.1 IELTS Reading Component

```typescript
// Dựa trên cấu trúc có sẵn trong src/pages/admin/ielts-reading/
const IeltsReadingView = ({ passage, questions }) => {
  return (
    <div className="ielts-reading-container">
      <div className="passage-section">
        <h2>{passage.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: passage.content }} />
      </div>
      
      <div className="questions-section">
        {questions.map((question, index) => (
          <QuestionComponent key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
};
```

### 7.2 Writing Assessment View

```typescript
// Dựa trên tính năng Gemini integration
const WritingAssessmentView = ({ submission, assessment }) => {
  return (
    <div className="writing-assessment">
      <div className="submission-content">
        <h3>Bài viết của bạn:</h3>
        <p>{submission.content}</p>
      </div>
      
      <div className="assessment-results">
        <h3>Kết quả đánh giá:</h3>
        <div className="score">Điểm: {assessment.score}/10</div>
        <div className="feedback">{assessment.feedback}</div>
        <div className="suggestions">
          <h4>Gợi ý cải thiện:</h4>
          <ul>
            {assessment.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
```

## 8. Debugging và Troubleshooting

### 8.1 Common Issues
- **Prisma Connection**: Kiểm tra DATABASE_URL trong .env
- **Firebase Auth**: Kiểm tra Firebase config
- **API Routes**: Kiểm tra method và endpoint
- **TypeScript Errors**: Kiểm tra type definitions

### 8.2 Development Tools
- **Next.js DevTools**: Sử dụng React DevTools
- **Prisma Studio**: GUI cho database
- **Console Logging**: Debug với console.log
- **Network Tab**: Kiểm tra API calls

## 9. Deployment

### 9.1 Vercel Deployment
- Kết nối GitHub repository
- Cấu hình environment variables
- Thiết lập custom domain

### 9.2 Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

## 10. Tài Liệu Tham Khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

---

*Tài liệu này được tạo dựa trên cấu trúc thực tế của dự án Vocab App. Để biết thêm chi tiết, vui lòng tham khảo source code trong thư mục dự án.*