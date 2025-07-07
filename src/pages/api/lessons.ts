import type { NextApiRequest, NextApiResponse } from 'next';

const mockLessons = [
  { id: 1, title: 'Viết email xin nghỉ phép', description: 'Bài luyện viết email xin nghỉ phép cho sếp.', level: 'beginner', type: 'emails' },
  { id: 2, title: 'Nhật ký ngày đầu đi làm', description: 'Viết về trải nghiệm ngày đầu tiên đi làm.', level: 'beginner', type: 'diaries' },
  { id: 3, title: 'Bài luận về môi trường', description: 'Nêu ý kiến về bảo vệ môi trường.', level: 'intermediate', type: 'essays' },
  { id: 4, title: 'Báo cáo kết quả học tập', description: 'Báo cáo ngắn về kết quả học tập.', level: 'advanced', type: 'reports' },
  { id: 5, title: 'Tin tức công nghệ', description: 'Bài báo về công nghệ mới.', level: 'intermediate', type: 'articles' },
  { id: 6, title: 'Truyện ngắn: Người bạn nhỏ', description: 'Một câu chuyện ngắn ý nghĩa.', level: 'beginner', type: 'stories' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { level, type } = req.query;
  const filtered = mockLessons.filter(
    (l) => (!level || l.level === level) && (!type || l.type === type)
  );
  res.status(200).json(filtered);
} 