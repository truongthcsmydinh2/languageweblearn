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

    console.log('=== TESTING URL FETCH ===');
    console.log('URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('=== URL DATA RECEIVED ===');
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data));
    console.log('Title:', data.title);
    console.log('Content exists:', !!data.content);
    console.log('Content rendered exists:', !!data.content?.rendered);
    console.log('Content length:', data.content?.rendered?.length || 0);
    console.log('=== END URL DATA ===');
    
    return res.status(200).json({
      success: true,
      data: {
        title: data.title,
        contentLength: data.content?.rendered?.length || 0,
        contentPreview: data.content?.rendered?.substring(0, 200) || 'No content',
        keys: Object.keys(data)
      }
    });
    
  } catch (error: any) {
    console.error('Error testing URL:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error testing URL: ${error.message}` 
    });
  }
} 