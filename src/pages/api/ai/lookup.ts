import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the word or phrase "${text}" and provide:
1. Word type (noun, verb, adjective, etc.) in Vietnamese
2. Vietnamese meaning
3. An example sentence in English

Respond in JSON format:
{
  "type": "loại từ",
  "meaning": "nghĩa tiếng Việt",
  "example": "example sentence"
}`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      
      try {
        // Try to parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return res.status(200).json(result);
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
      }
      
      // Fallback: extract information manually
      return res.status(200).json({
        type: 'từ',
        meaning: content.substring(0, 100) + '...',
        example: 'Example not available'
      });
    }

    return res.status(500).json({ message: 'Failed to get AI response' });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}