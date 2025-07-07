import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text1, text2 } = req.body;

    if (!text1 || !text2) {
      return res.status(400).json({ message: 'Thiếu tham số' });
    }

    const similarity = calculateSimilarity(text1, text2);

    return res.status(200).json({
      similarity,
      isCorrect: similarity >= 70
    });
  } catch (error) {
    console.error('Error checking similarity:', error);
    return res.status(500).json({ message: 'Lỗi khi kiểm tra độ tương đồng' });
  }
}

// Hàm tính độ tương đồng giữa hai chuỗi
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Tính khoảng cách Levenshtein
  const distance = levenshteinDistance(s1, s2);
  
  // Tính độ tương đồng (%)
  const maxLength = Math.max(s1.length, s2.length);
  return ((maxLength - distance) / maxLength) * 100;
}

// Hàm tính khoảng cách Levenshtein
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[b.length][a.length];
} 