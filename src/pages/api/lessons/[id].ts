import type { NextApiRequest, NextApiResponse } from 'next';

const mockLessons = [
  { id: 1, title: 'Viết email xin nghỉ phép', sentences: [
    { id: 101, vietnamese_text: 'Em xin phép nghỉ làm ngày mai.', sentence_order: 1 },
    { id: 102, vietnamese_text: 'Lý do là em bị ốm.', sentence_order: 2 },
    { id: 103, vietnamese_text: 'Em sẽ hoàn thành công việc còn lại sau khi đi làm lại.', sentence_order: 3 },
  ] },
  { id: 2, title: 'Nhật ký ngày đầu đi làm', sentences: [
    { id: 201, vietnamese_text: 'Hôm nay là ngày đầu tiên tôi đi làm.', sentence_order: 1 },
    { id: 202, vietnamese_text: 'Tôi cảm thấy rất hồi hộp và háo hức.', sentence_order: 2 },
    { id: 203, vietnamese_text: 'Mọi người trong công ty rất thân thiện.', sentence_order: 3 },
  ] },
  { id: 3, title: 'Bài luận về môi trường', sentences: [
    { id: 301, vietnamese_text: 'Môi trường đang bị ô nhiễm nghiêm trọng.', sentence_order: 1 },
    { id: 302, vietnamese_text: 'Chúng ta cần hành động để bảo vệ môi trường.', sentence_order: 2 },
    { id: 303, vietnamese_text: 'Mỗi người nên bắt đầu từ những việc nhỏ nhất.', sentence_order: 3 },
  ] },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const lesson = mockLessons.find(l => l.id === Number(id));
  if (!lesson) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(lesson);
} 