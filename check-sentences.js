const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSentences() {
  try {
    console.log('Kiểm tra lessonId=10...');
    
    // Kiểm tra lesson có tồn tại không
    const lesson = await prisma.writingLesson.findUnique({
      where: { id: 10 }
    });
    
    if (!lesson) {
      console.log('❌ LessonId=10 không tồn tại!');
      return;
    }
    
    console.log('✅ LessonId=10 tồn tại:', lesson.title);
    
    // Lấy tất cả sentence thuộc lessonId=10
    const sentences = await prisma.writingSentence.findMany({
      where: { lesson_id: 10 }
    });
    
    console.log(`📝 Tìm thấy ${sentences.length} câu thuộc lessonId=10:`);
    sentences.forEach((s, index) => {
      console.log(`  ${index + 1}. ID: ${s.id}, Câu: "${s.vietnamese}"`);
    });
    
    if (sentences.length === 0) {
      console.log('❌ Không có câu nào thuộc lessonId=10!');
    }
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSentences(); 