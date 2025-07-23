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
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the word or phrase "${text}" and provide:
1. Word type (noun, verb, adjective, etc.) in English
2. Vietnamese meaning
3. An example sentence in English

Respond in JSON format:
{
  "type": "adjective",
  "meaning": "nghĩa tiếng Việt",
  "example": "example sentence"
}`
          }]
        }]
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      return res.status(500).json({ message: 'Failed to call Gemini API' });
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      console.log('AI content:', content);
      
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
      const lines = content.split('\n').filter(line => line.trim());
      let type = 'word';
      let meaning = 'Không có nghĩa';
      let example = 'Không có ví dụ';
      
      for (const line of lines) {
        if (line.toLowerCase().includes('type') || line.includes('loại')) {
          type = line.split(':')[1]?.trim() || type;
        } else if (line.toLowerCase().includes('meaning') || line.includes('nghĩa')) {
          meaning = line.split(':')[1]?.trim() || meaning;
        } else if (line.toLowerCase().includes('example') || line.includes('ví dụ')) {
          example = line.split(':')[1]?.trim() || example;
        }
      }
      
      return res.status(200).json({
        type: type.replace(/["']/g, ''),
        meaning: meaning.replace(/["']/g, ''),
        example: example.replace(/["']/g, '')
      });
    }

    return res.status(500).json({ message: 'Failed to get AI response' });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}