import { connectToDatabase } from '@/lib/mysql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'Firebase UID và email là bắt buộc' });
    }
    
    const conn = await connectToDatabase();
    
    // Kiểm tra user đã tồn tại theo firebase_uid
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE firebase_uid = ?', 
      [firebaseUid]
    );
    
    const currentTime = new Date();
    
    if (rows.length === 0) {
      // Thêm user mới
      await conn.execute(
        'INSERT INTO users (firebase_uid, email, display_name, photo_url, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)',
        [firebaseUid, email, displayName || '', photoURL || '', currentTime, currentTime]
      );
    } else {
      // Cập nhật thông tin và last_login
      await conn.execute(
        'UPDATE users SET email = ?, display_name = ?, photo_url = ?, last_login = ? WHERE firebase_uid = ?',
        [email, displayName || '', photoURL || '', currentTime, firebaseUid]
      );
    }
    
    await conn.end();
    return res.status(200).json({ 
      success: true,
      message: rows.length === 0 ? 'User created' : 'User updated'
    });
  } catch (error) {
    console.error('Lỗi khi lưu thông tin user:', error);
    return res.status(500).json({ error: error.message });
  }
}