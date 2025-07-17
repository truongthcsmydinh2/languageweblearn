import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    console.log('=== TESTING HTML PARSE ===');
    console.log('URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const { JSDOM } = require('jsdom');
    
    // Lấy content HTML
    const htmlContent = data.content?.rendered || '';
    console.log('HTML content length:', htmlContent.length);
    
    if (htmlContent.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No HTML content found' 
      });
    }
    
    // Parse HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Loại bỏ các thẻ không cần thiết
    const elementsToRemove = document.querySelectorAll('script, style, meta, link, noscript, iframe, embed, object, param');
    elementsToRemove.forEach((el: any) => el.remove());
    
    // Loại bỏ các thuộc tính style, class, id
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el: any) => {
      el.removeAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('id');
      el.removeAttribute('data-*');
    });
    
    // Hàm làm sạch text
    const cleanText = (text: string): string => {
      return text
        .replace(/[^\w\s.,!?;:()\-'""'()[\]{}]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
    };
    
    // Tìm các section
    const sections: {type: string, content: string, title?: string}[] = [];
    
    // 1. Tìm bài đọc trong toggle
    const toggleItems = document.querySelectorAll('.elementor-toggle-item');
    console.log('Toggle items found:', toggleItems.length);
    
    toggleItems.forEach((item: any, index: number) => {
      const titleElement = item.querySelector('.elementor-tab-title');
      const contentElement = item.querySelector('.elementor-tab-content');
      
      if (titleElement && contentElement) {
        const title = cleanText(titleElement.textContent || '');
        const content = cleanText(contentElement.textContent || '');
        
        console.log(`Toggle ${index}:`, title.substring(0, 50));
        
        if (title.toLowerCase().includes('pirates') || title.toLowerCase().includes('mediterranean') || 
            title.toLowerCase().includes('bài đọc') || title.toLowerCase().includes('reading')) {
          sections.push({
            type: 'reading',
            content: content,
            title: title
          });
        }
      }
    });
    
    // 2. Tìm headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log('Headings found:', headings.length);
    
    headings.forEach((heading: any, index: number) => {
      const headingText = cleanText(heading.textContent || '');
      console.log(`Heading ${index}:`, headingText);
      
      if (headingText.length > 5) {
        let sectionType = 'other';
        if (headingText.toLowerCase().includes('bài đọc') || headingText.toLowerCase().includes('reading')) {
          sectionType = 'reading';
        } else if (headingText.toLowerCase().includes('bài tập') || headingText.toLowerCase().includes('câu hỏi')) {
          sectionType = 'questions';
        } else if (headingText.toLowerCase().includes('giải thích')) {
          sectionType = 'explanations';
        } else if (headingText.toLowerCase().includes('đáp án')) {
          sectionType = 'answers';
        }
        
        sections.push({
          type: sectionType,
          content: headingText,
          title: headingText
        });
      }
    });
    
    // 3. Tìm scripts
    const scripts = document.querySelectorAll('script');
    console.log('Scripts found:', scripts.length);
    
    scripts.forEach((script: any, index: number) => {
      const scriptContent = script.textContent || '';
      if (scriptContent.includes('quiz = new Quiz') || scriptContent.includes('["')) {
        console.log(`Script ${index} contains quiz data`);
        sections.push({
          type: 'answers_script',
          content: scriptContent.substring(0, 200) + '...',
          title: 'Quiz Script'
        });
      }
    });
    
    // 4. Tìm tables
    const tables = document.querySelectorAll('table');
    console.log('Tables found:', tables.length);
    
    tables.forEach((table: any, index: number) => {
      const tableText = cleanText(table.textContent || '');
      if (tableText.includes('giải thích') || tableText.includes('câu') || tableText.includes('đáp án')) {
        console.log(`Table ${index} contains explanations`);
        sections.push({
          type: 'explanations_table',
          content: tableText.substring(0, 200) + '...',
          title: 'Explanations Table'
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        title: data.title?.rendered || 'No title',
        sections: sections,
        totalSections: sections.length,
        readingSections: sections.filter(s => s.type === 'reading').length,
        questionSections: sections.filter(s => s.type === 'questions').length,
        explanationSections: sections.filter(s => s.type === 'explanations' || s.type === 'explanations_table').length,
        answerSections: sections.filter(s => s.type === 'answers_script').length
      }
    });
    
  } catch (error: any) {
    console.error('Error testing HTML parse:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error testing HTML parse: ${error.message}` 
    });
  }
} 