const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedIeltsReading() {
  try {
    console.log('Bắt đầu thêm dữ liệu mẫu IELTS Reading...');

    // Tạo bài đọc mẫu
    const passage1 = await prisma.ielts_reading_passages.create({
      data: {
        title: 'The Future of Renewable Energy',
        content: `Renewable energy has become a crucial topic in today's world as we face the challenges of climate change and the need for sustainable development. Solar power, wind energy, and hydroelectric power are among the most promising renewable energy sources that can help reduce our dependence on fossil fuels.

Solar energy, derived from the sun's radiation, is one of the most abundant and clean energy sources available. Solar panels convert sunlight directly into electricity through the photovoltaic effect. This technology has seen remarkable improvements in efficiency and cost reduction over the past decade, making it increasingly accessible to households and businesses worldwide.

Wind energy, another significant renewable source, harnesses the power of moving air to generate electricity. Wind turbines, both onshore and offshore, have become a common sight in many countries. The technology has evolved to capture wind energy more efficiently, even in areas with moderate wind speeds.

Hydroelectric power, generated from flowing water, remains one of the most reliable renewable energy sources. Large-scale hydroelectric dams can provide substantial amounts of electricity, while smaller micro-hydro systems can serve local communities effectively.

The integration of these renewable energy sources into existing power grids presents both opportunities and challenges. Smart grid technology and energy storage solutions are essential for managing the intermittent nature of renewable energy sources and ensuring a stable power supply.

Government policies and incentives play a crucial role in accelerating the adoption of renewable energy. Many countries have implemented feed-in tariffs, tax credits, and other financial incentives to encourage investment in renewable energy projects.`,
        level: 'intermediate',
        category: 'Science & Technology',
        time_limit: 20,
        is_active: true
      }
    });

    console.log('Đã tạo bài đọc:', passage1.title);

    // Tạo câu hỏi cho bài đọc 1
    const questions1 = [
      {
        passage_id: passage1.id,
        question_text: 'What is the main advantage of solar energy mentioned in the passage?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'It is the cheapest energy source',
          'It is abundant and clean',
          'It works in all weather conditions',
          'It requires no maintenance'
        ]),
        correct_answer: 'It is abundant and clean',
        explanation: 'The passage states that solar energy is "one of the most abundant and clean energy sources available."',
        order_index: 1
      },
      {
        passage_id: passage1.id,
        question_text: 'According to the passage, what has improved in solar technology over the past decade?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'Size of solar panels',
          'Efficiency and cost reduction',
          'Color of solar panels',
          'Weight of solar panels'
        ]),
        correct_answer: 'Efficiency and cost reduction',
        explanation: 'The passage mentions "remarkable improvements in efficiency and cost reduction over the past decade."',
        order_index: 2
      },
      {
        passage_id: passage1.id,
        question_text: 'Wind turbines can generate electricity from moving air.',
        question_type: 'true_false',
        options: null,
        correct_answer: 'True',
        explanation: 'The passage states that wind energy "harnesses the power of moving air to generate electricity."',
        order_index: 3
      },
      {
        passage_id: passage1.id,
        question_text: 'What type of renewable energy is described as "one of the most reliable"?',
        question_type: 'fill_blank',
        options: null,
        correct_answer: 'hydroelectric power',
        explanation: 'The passage states that "Hydroelectric power, generated from flowing water, remains one of the most reliable renewable energy sources."',
        order_index: 4
      },
      {
        passage_id: passage1.id,
        question_text: 'Government policies are not important for renewable energy adoption.',
        question_type: 'true_false',
        options: null,
        correct_answer: 'False',
        explanation: 'The passage states that "Government policies and incentives play a crucial role in accelerating the adoption of renewable energy."',
        order_index: 5
      }
    ];

    for (const question of questions1) {
      await prisma.ielts_reading_questions.create({
        data: question
      });
    }

    console.log('Đã tạo 5 câu hỏi cho bài đọc 1');

    // Tạo bài đọc thứ 2
    const passage2 = await prisma.ielts_reading_passages.create({
      data: {
        title: 'The Impact of Social Media on Modern Communication',
        content: `Social media has fundamentally transformed the way people communicate and interact in the modern world. Platforms such as Facebook, Twitter, Instagram, and LinkedIn have created new opportunities for connection while also presenting unique challenges to traditional forms of communication.

One of the most significant impacts of social media is its ability to connect people across geographical boundaries. Individuals can now maintain relationships with friends and family members who live in different countries, share experiences in real-time, and participate in global conversations about important issues. This has created a more interconnected world where information and ideas can spread rapidly across borders.

However, the rise of social media has also raised concerns about the quality of interpersonal communication. Many researchers argue that digital communication lacks the depth and nuance of face-to-face interactions. Non-verbal cues such as body language, facial expressions, and tone of voice are often lost in text-based communication, potentially leading to misunderstandings and miscommunications.

The speed and accessibility of social media have also changed how people consume and share information. News and events can spread virally within minutes, reaching millions of people worldwide. This rapid dissemination of information has both positive and negative implications. On the positive side, it allows for greater awareness of important issues and facilitates social movements. On the negative side, it can also spread misinformation and contribute to the spread of rumors and fake news.

Privacy concerns have emerged as another significant issue related to social media use. Users often share personal information, photos, and updates without fully considering the long-term implications of their digital footprint. This has led to discussions about data protection, online privacy, and the responsibility of social media companies to protect user information.

Despite these challenges, social media continues to evolve and adapt to user needs. New features and platforms emerge regularly, offering different ways to communicate and connect. The future of social media communication will likely involve more sophisticated tools for maintaining privacy while still enabling meaningful connections.`,
        level: 'advanced',
        category: 'Social Sciences',
        time_limit: 25,
        is_active: true
      }
    });

    console.log('Đã tạo bài đọc:', passage2.title);

    // Tạo câu hỏi cho bài đọc 2
    const questions2 = [
      {
        passage_id: passage2.id,
        question_text: 'What is mentioned as a positive impact of social media on communication?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'It reduces face-to-face interactions',
          'It connects people across geographical boundaries',
          'It eliminates privacy concerns',
          'It slows down information sharing'
        ]),
        correct_answer: 'It connects people across geographical boundaries',
        explanation: 'The passage states that social media "has the ability to connect people across geographical boundaries."',
        order_index: 1
      },
      {
        passage_id: passage2.id,
        question_text: 'According to the passage, what is often lost in digital communication?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'Text messages',
          'Non-verbal cues',
          'Digital files',
          'Social media posts'
        ]),
        correct_answer: 'Non-verbal cues',
        explanation: 'The passage mentions that "Non-verbal cues such as body language, facial expressions, and tone of voice are often lost in text-based communication."',
        order_index: 2
      },
      {
        passage_id: passage2.id,
        question_text: 'Social media can spread both accurate information and misinformation.',
        question_type: 'true_false',
        options: null,
        correct_answer: 'True',
        explanation: 'The passage states that social media "can also spread misinformation and contribute to the spread of rumors and fake news."',
        order_index: 3
      },
      {
        passage_id: passage2.id,
        question_text: 'What has emerged as a significant concern related to social media use?',
        question_type: 'fill_blank',
        options: null,
        correct_answer: 'privacy concerns',
        explanation: 'The passage states that "Privacy concerns have emerged as another significant issue related to social media use."',
        order_index: 4
      },
      {
        passage_id: passage2.id,
        question_text: 'The future of social media will involve more sophisticated privacy tools.',
        question_type: 'true_false',
        options: null,
        correct_answer: 'True',
        explanation: 'The passage states that "The future of social media communication will likely involve more sophisticated tools for maintaining privacy."',
        order_index: 5
      }
    ];

    for (const question of questions2) {
      await prisma.ielts_reading_questions.create({
        data: question
      });
    }

    console.log('Đã tạo 5 câu hỏi cho bài đọc 2');

    console.log('Hoàn thành thêm dữ liệu mẫu IELTS Reading!');

  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu mẫu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedIeltsReading(); 