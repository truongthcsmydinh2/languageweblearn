import { connectToDatabase } from '@/lib/mysql';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const conn = await connectToDatabase();
    
    // Kiểm tra user trong MySQL
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE firebase_uid = ?', 
      [uid]
    );
    
    await conn.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        exists: false,
        message: 'User not found in MySQL database'
      });
    }
    
    return res.status(200).json({ 
      exists: true, 
      user: {
        id: rows[0].id,
        firebase_uid: rows[0].firebase_uid,
        email: rows[0].email,
        display_name: rows[0].display_name,
        photo_url: rows[0].photo_url,
        created_at: rows[0].created_at,
        last_login: rows[0].last_login
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra thông tin user:', error);
    return res.status(500).json({ error: error.message });
  }
} 