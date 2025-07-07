import type { NextApiRequest, NextApiResponse } from 'next';
import { migrateUserData } from './migration';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Kiểm tra phương thức
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Kiểm tra xác thực (trong môi trường thực tế, bạn cần xác thực người dùng)
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    // Thực hiện migration
    await migrateUserData(userId);
    
    // Trả về kết quả thành công
    return res.status(200).json({ 
      success: true,
      message: 'Data migration completed successfully' 
    });
  } catch (error) {
    console.error('API migration error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Migration failed', 
      error: String(error) 
    });
  }
}
