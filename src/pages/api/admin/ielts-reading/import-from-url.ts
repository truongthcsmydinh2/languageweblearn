import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation function for URL
function validateUrl(url: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL phải sử dụng giao thức HTTP hoặc HTTPS');
    }
    
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      errors.push('Tên miền không hợp lệ');
    }
    
  } catch (error) {
    errors.push('URL không đúng định dạng');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'URL is required and must be a string' 
      });
    }
    
    // Validate URL format
    const urlValidation = validateUrl(url.trim());
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `URL không hợp lệ: ${urlValidation.errors.join(', ')}`
      });
    }

    console.log('=== IMPORTING FROM URL ===');
    console.log('URL:', url.trim());

    // Lấy dữ liệu từ URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const htmlContent = await response.text();
    console.log('Content length:', htmlContent.length);

    // Kiểm tra xem có phải là JSON không
    if (htmlContent.trim().startsWith('{') || htmlContent.trim().startsWith('[')) {
      try {
        const jsonData = JSON.parse(htmlContent);
        console.log('Detected JSON content, processing as JSON data');
        
        // Xử lý JSON data tương tự như endpoint import cũ
        if (jsonData.passages && Array.isArray(jsonData.passages)) {
          // Xử lý multiple passages
          const passage = jsonData.passages[0]; // Lấy passage đầu tiên
          const title = typeof passage.title === 'object' && passage.title.rendered 
            ? passage.title.rendered 
            : passage.title;
          const content = typeof passage.content === 'object' && passage.content.rendered 
            ? passage.content.rendered 
            : passage.content;

          if (title && content) {
            // Giới hạn độ dài
            const MAX_CONTENT_LENGTH = 65000;
            const MAX_TITLE_LENGTH = 255;

            let finalTitle = title;
            if (finalTitle.length > MAX_TITLE_LENGTH) {
              finalTitle = finalTitle.substring(0, MAX_TITLE_LENGTH - 3) + '...';
            }

            let finalContent = content;
            if (finalContent.length > MAX_CONTENT_LENGTH) {
              finalContent = finalContent.substring(0, MAX_CONTENT_LENGTH - 3) + '...';
            }

            const passageData = await prisma.ielts_reading_passages.create({
              data: {
                title: finalTitle,
                content: finalContent,
                level: 'intermediate',
                category: 'Imported from URL (JSON)',
                time_limit: 60,
                is_active: true
              }
            });

            return res.status(200).json({
              success: true,
              message: 'Import from JSON URL completed successfully',
              passageId: passageData.id,
              title: finalTitle,
              additionalInfo: {
                url: url,
                hasQuestions: false,
                hasExplanations: false,
                hasAnswers: false,
                sourceType: 'JSON'
              }
            });
          }
        }
      } catch (error) {
        console.log('Failed to parse as JSON, treating as HTML');
      }
    }

    // Parse HTML để lấy dữ liệu
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Loại bỏ các phần không cần thiết trước khi parse
    const elementsToRemove = document.querySelectorAll('script, style, meta, link, noscript, iframe, embed, object, param, nav, footer, header, .header, .footer, .nav, .sidebar, .advertisement, .ads, .social-share, .comments, .related-posts');
    elementsToRemove.forEach((el: any) => el.remove());

    console.log('Removed unnecessary elements, remaining content length:', document.body.textContent?.length || 0);

    // Hàm làm sạch text
    const cleanText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&#8211;/g, '-')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&#8230;/g, '…')
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8218;/g, '‚')
        .replace(/&#8219;/g, '')
        .replace(/&#8222;/g, '„')
        .replace(/&#8223;/g, '‟')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Lấy title từ meta hoặc h1
    let title = '';
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) {
      title = cleanText(metaTitle.getAttribute('content') || '');
    } else {
      const h1Title = document.querySelector('h1');
      if (h1Title) {
        title = cleanText(h1Title.textContent || '');
      }
    }

    console.log('Extracted title:', title);

    // Tìm bài đọc trong các section
    let readingContent = '';
    let questionsContent = '';
    let explanationsContent = '';
    let answersContent = '';

    // 1. Tìm trong Elementor toggle/accordion
    const toggleItems = document.querySelectorAll('.elementor-toggle-item');
    toggleItems.forEach((item: any) => {
      const titleElement = item.querySelector('.elementor-tab-title');
      const contentElement = item.querySelector('.elementor-tab-content');
      
      if (titleElement && contentElement) {
        const tabTitle = cleanText(titleElement.textContent || '');
        const tabContent = cleanText(contentElement.textContent || '');
        
        // Giới hạn độ dài content để tránh quá dài
        if (tabContent.length > 50000) {
          console.log(`Toggle content too long (${tabContent.length} chars), skipping:`, tabTitle);
          return;
        }
        
        if (tabTitle.toLowerCase().includes('pirates') || 
            tabTitle.toLowerCase().includes('mediterranean') || 
            tabTitle.toLowerCase().includes('bài đọc') || 
            tabTitle.toLowerCase().includes('reading') ||
            tabTitle.toLowerCase().includes('passage')) {
          readingContent = tabContent;
          console.log('Found reading in toggle:', tabTitle);
        } else if (tabTitle.toLowerCase().includes('câu hỏi') || 
                   tabTitle.toLowerCase().includes('questions') ||
                   tabTitle.toLowerCase().includes('bài tập')) {
          questionsContent = tabContent;
          console.log('Found questions in toggle:', tabTitle);
        } else if (tabTitle.toLowerCase().includes('giải thích') || 
                   tabTitle.toLowerCase().includes('explanation')) {
          explanationsContent = tabContent;
          console.log('Found explanations in toggle:', tabTitle);
        }
      }
    });

    // 2. Tìm trong Elementor tabs
    const tabItems = document.querySelectorAll('.elementor-tab-content');
    tabItems.forEach((tab: any) => {
      const tabTitle = tab.getAttribute('data-tab') || '';
      const tabContent = cleanText(tab.textContent || '');
      
      if (tabTitle.toLowerCase().includes('reading') || 
          tabTitle.toLowerCase().includes('passage')) {
        readingContent = tabContent;
        console.log('Found reading in tab:', tabTitle);
      } else if (tabTitle.toLowerCase().includes('questions')) {
        questionsContent = tabContent;
        console.log('Found questions in tab:', tabTitle);
      }
    });

    // 3. Tìm trong các heading và section
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading: any) => {
      const headingText = cleanText(heading.textContent || '');
      
      if (headingText.toLowerCase().includes('bài đọc') || 
          headingText.toLowerCase().includes('reading') ||
          headingText.toLowerCase().includes('passage')) {
        
        // Lấy nội dung từ heading này đến heading tiếp theo
        let content = '';
        let nextElement = heading.nextElementSibling;
        let contentLength = 0;
        const maxContentLength = 50000; // Giới hạn độ dài content
        
        while (nextElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextElement.tagName) && contentLength < maxContentLength) {
          const text = cleanText(nextElement.textContent || '');
          if (text.length > 10) {
            content += text + '\n\n';
            contentLength += text.length;
          }
          nextElement = nextElement.nextElementSibling;
        }
        
        if (content.trim()) {
          readingContent = content.trim();
          console.log('Found reading in heading:', headingText, 'Length:', readingContent.length);
        }
      } else if (headingText.toLowerCase().includes('câu hỏi') || 
                 headingText.toLowerCase().includes('questions')) {
        
        let content = '';
        let nextElement = heading.nextElementSibling;
        let contentLength = 0;
        const maxContentLength = 30000; // Giới hạn độ dài cho câu hỏi
        
        while (nextElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextElement.tagName) && contentLength < maxContentLength) {
          const text = cleanText(nextElement.textContent || '');
          if (text.length > 10) {
            content += text + '\n\n';
            contentLength += text.length;
          }
          nextElement = nextElement.nextElementSibling;
        }
        
        if (content.trim()) {
          questionsContent = content.trim();
          console.log('Found questions in heading:', headingText, 'Length:', questionsContent.length);
        }
      }
    });

    // 4. Tìm đáp án trong script tags
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script: any) => {
      const scriptContent = script.textContent || '';
      if (scriptContent.includes('quiz') || scriptContent.includes('answers') || scriptContent.includes('["')) {
        // Tìm mảng đáp án
        const answerMatch = scriptContent.match(/\[\[([^\]]+)\]\]/g);
        if (answerMatch) {
          const answers = answerMatch.map((match: string) => {
            return match.replace(/[\[\]"]/g, '').split(',').map((a: string) => a.trim());
          });
          answersContent = JSON.stringify(answers);
          console.log('Found answers in script');
        }
      }
    });

    // 5. Tìm giải thích trong bảng
    const tables = document.querySelectorAll('table');
    tables.forEach((table: any) => {
      const tableText = cleanText(table.textContent || '');
      if (tableText.includes('giải thích') || tableText.includes('explanation')) {
        explanationsContent = tableText;
        console.log('Found explanations in table');
      }
    });

    // 6. Fallback: tách theo paragraph nếu không tìm thấy section rõ ràng
    if (!readingContent && !questionsContent) {
      const paragraphs = document.querySelectorAll('p, div');
      const textParts: string[] = [];
      
      paragraphs.forEach((element: any) => {
        const text = cleanText(element.textContent || '');
        if (text.length > 50 && text.length < 2000) { // Chỉ lấy đoạn có ý nghĩa và không quá dài
          textParts.push(text);
        }
      });
      
      if (textParts.length > 0) {
        // Giới hạn số lượng paragraph để tránh content quá dài
        const maxParagraphs = 50;
        const limitedTextParts = textParts.slice(0, maxParagraphs);
        
        // Tách thành các phần dựa trên độ dài
        const readingPart = limitedTextParts.slice(0, Math.floor(limitedTextParts.length * 0.6)).join('\n\n');
        const questionsPart = limitedTextParts.slice(Math.floor(limitedTextParts.length * 0.6)).join('\n\n');
        
        if (readingPart) {
          readingContent = readingPart;
        }
        if (questionsPart) {
          questionsContent = questionsPart;
        }
      }
    }

    // 7. Ưu tiên tìm bài đọc trong các phần có ý nghĩa nhất
    if (!readingContent) {
      // Tìm trong các div có class chứa 'content', 'main', 'article', 'post'
      const contentSelectors = [
        '.content', '.main', '.article', '.post', '.entry-content', 
        '.post-content', '.article-content', '.main-content',
        '[class*="content"]', '[class*="main"]', '[class*="article"]'
      ];
      
      for (const selector of contentSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = cleanText(element.textContent || '');
          if (text.length > 500 && text.length < 50000) {
            readingContent = text;
            console.log('Found reading in content selector:', selector, 'Length:', text.length);
            break;
          }
        }
        if (readingContent) break;
      }
    }

    // 8. Nếu vẫn không có content, lấy một phần nhỏ từ body
    if (!readingContent) {
      const bodyText = cleanText(document.body.textContent || '');
      if (bodyText.length > 100) {
        // Lấy 2000 ký tự đầu tiên thay vì 1000
        readingContent = bodyText.substring(0, 2000);
        console.log('Using fallback body text (first 2000 chars)');
      }
    }

    // Tạo bài đọc trong database
    if (!readingContent) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract reading content from the URL'
      });
    }

    // Giới hạn độ dài content để tránh lỗi database
    const MAX_CONTENT_LENGTH = 65000; // Giới hạn an toàn cho MySQL TEXT
    const MAX_TITLE_LENGTH = 255; // Giới hạn cho VARCHAR

    let finalTitle = title || 'Imported from URL';
    if (finalTitle.length > MAX_TITLE_LENGTH) {
      finalTitle = finalTitle.substring(0, MAX_TITLE_LENGTH - 3) + '...';
    }

    let finalContent = readingContent;
    if (finalContent.length > MAX_CONTENT_LENGTH) {
      console.log(`Content too long (${finalContent.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
      finalContent = finalContent.substring(0, MAX_CONTENT_LENGTH - 3) + '...';
    }

    console.log('=== CREATING PASSAGE ===');
    console.log('Title:', finalTitle);
    console.log('Title length:', finalTitle.length);
    console.log('Reading content length:', finalContent.length);
    console.log('Questions content length:', questionsContent.length);
    console.log('Explanations content length:', explanationsContent.length);
    console.log('Answers content length:', answersContent.length);

    // Tạo bài đọc
    const passageData = await prisma.ielts_reading_passages.create({
      data: {
        title: finalTitle,
        content: finalContent,
        level: 'intermediate',
        category: 'Imported from URL',
        time_limit: 60,
        is_active: true
      }
    });

    console.log('Created passage:', passageData.id);

    // Tạo nhóm câu hỏi nếu có câu hỏi
    if (questionsContent) {
      const groupData = await prisma.ielts_reading_question_groups.create({
        data: {
          instructions: 'Answer the following questions based on the reading passage',
          question_type: 'multiple_choice',
          display_order: 1,
          passage_id: passageData.id
        }
      });

      console.log('Created question group:', groupData.id);

      // Parse câu hỏi từ content
      const questionLines = questionsContent.split('\n').filter(line => line.trim().length > 10);
      let questionIndex = 1;

      for (const line of questionLines) {
        if (line.includes('?') || line.match(/^\d+\./)) {
          // Tạo câu hỏi
          const questionData = await prisma.ielts_reading_questions.create({
            data: {
              question_text: line,
              question_type: 'multiple_choice',
              options: [],
              correct_answer: '',
              explanation: '',
              note: '',
              order_index: questionIndex,
              group_id: groupData.id
            }
          });

          console.log('Created question:', questionData.id);
          questionIndex++;
        }
      }
    }

    // Lưu thông tin bổ sung
    const additionalInfo = {
      url: url,
      hasQuestions: !!questionsContent,
      hasExplanations: !!explanationsContent,
      hasAnswers: !!answersContent,
      questionsContent: questionsContent,
      explanationsContent: explanationsContent,
      answersContent: answersContent
    };

    console.log('=== IMPORT COMPLETED ===');
    console.log('Passage ID:', passageData.id);
    console.log('Source URL:', url.trim());
    console.log('Additional info:', additionalInfo);

    return res.status(200).json({
      success: true,
      message: 'Import from URL completed successfully',
      passageId: passageData.id,
      title: title,
      sourceUrl: validatedUrl,
      importedAt: new Date().toISOString(),
      additionalInfo
    });

  } catch (error) {
    console.error('=== IMPORT FROM URL ERROR ===');
    console.error('URL:', url);
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide more specific error messages
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes('fetch')) {
      userFriendlyMessage = 'Không thể truy cập URL. Vui lòng kiểm tra URL và kết nối mạng.';
    } else if (errorMessage.includes('JSON')) {
      userFriendlyMessage = 'Nội dung URL không phải là JSON hợp lệ.';
    } else if (errorMessage.includes('parse')) {
      userFriendlyMessage = 'Không thể phân tích nội dung từ URL.';
    }
    
    return res.status(500).json({
      success: false,
      message: 'Import from URL failed',
      error: userFriendlyMessage,
      sourceUrl: validatedUrl,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}