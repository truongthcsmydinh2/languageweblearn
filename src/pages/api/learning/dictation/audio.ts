import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log('===== API AUDIO ĐƯỢC GỌI =====');
      const { file } = req.query;
      
      if (!file || typeof file !== 'string') {
        console.log('Thiếu tham số file hoặc tham số không hợp lệ');
        return res.status(400).json({ message: 'Thiếu tham số file' });
      }
      
      console.log(`Đang tìm kiếm thông tin audio cho file: ${file}`);
      
      try {
        // Lấy dữ liệu audio trực tiếp từ database
        const [rows] = await db.execute(
          'SELECT audio_data, file_name FROM dictation_exercises WHERE audio_file = ?',
          [file]
        );
        
        if ((rows as any[]).length === 0) {
          console.log(`Không tìm thấy thông tin của file audio: ${file}`);
          return res.status(404).json({ message: 'Không tìm thấy file audio' });
        }
        
        const audioData = (rows as any[])[0].audio_data;
        const fileName = (rows as any[])[0].file_name;
        
        if (!audioData) {
          console.log(`Không có dữ liệu audio cho file: ${file}`);
          return res.status(404).json({ message: 'Không có dữ liệu audio' });
        }
        
        // Thiết lập header phù hợp
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', audioData.length);
        
        console.log(`Phục vụ file audio: ${fileName} (${audioData.length} bytes)`);
        return res.status(200).send(audioData);
        
      } catch (dbError) {
        console.error('Lỗi khi truy vấn database:', dbError);
        return res.status(500).json({ message: 'Lỗi server', error: String(dbError) });
      }
    } catch (error) {
      console.error('Lỗi khi xử lý yêu cầu:', error);
      return res.status(500).json({ message: 'Lỗi server', error: String(error) });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
} 