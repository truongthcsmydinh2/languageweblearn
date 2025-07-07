const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

const sampleLessons = [
  {
    title: 'Email xin việc',
    content: 'Kính gửi Ban Giám đốc Công ty ABC. Tôi viết email này để ứng tuyển vị trí Nhân viên Marketing. Tôi có 3 năm kinh nghiệm trong lĩnh vực này. Tôi rất mong được phỏng vấn.',
    level: 'BEGINNER',
    type: 'EMAILS'
  },
  {
    title: 'Nhật ký cuối tuần',
    content: 'Cuối tuần này tôi đã đi chơi với bạn bè. Chúng tôi đã ăn tối ở nhà hàng mới. Sau đó chúng tôi xem phim ở rạp chiếu phim. Tôi cảm thấy rất vui vẻ.',
    level: 'BEGINNER',
    type: 'DIARIES'
  },
  {
    title: 'Bài luận về môi trường',
    content: 'Ô nhiễm môi trường là vấn đề nghiêm trọng hiện nay. Chúng ta cần bảo vệ môi trường bằng cách giảm thiểu rác thải. Mỗi người nên có ý thức bảo vệ môi trường.',
    level: 'INTERMEDIATE',
    type: 'ESSAYS'
  },
  {
    title: 'Bài báo về công nghệ',
    content: 'Trí tuệ nhân tạo đang phát triển nhanh chóng. Công nghệ này có thể thay đổi cách chúng ta làm việc. Tuy nhiên, chúng ta cần cân nhắc về tác động của nó.',
    level: 'ADVANCED',
    type: 'ARTICLES'
  }
];

async function seedData() {
  try {
    console.log('Bắt đầu thêm dữ liệu mẫu...');
    
    // Xóa dữ liệu cũ
    await prisma.writingSentence.deleteMany();
    await prisma.writingLesson.deleteMany();
    console.log('Đã xóa dữ liệu cũ');

    // Thêm dữ liệu mẫu
    for (const lessonData of sampleLessons) {
      const sentences = splitSentences(lessonData.content);
      const lesson = await prisma.writingLesson.create({
        data: {
          title: lessonData.title,
          content: lessonData.content,
          level: lessonData.level,
          type: lessonData.type,
          sentences: {
            create: sentences.map((vietnamese, idx) => ({ 
              vietnamese, 
              sentence_order: idx + 1 
            }))
          }
        }
      });
      console.log(`Đã tạo bài viết: ${lesson.title}`);
    }

    console.log('Hoàn thành thêm dữ liệu mẫu!');
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData(); 