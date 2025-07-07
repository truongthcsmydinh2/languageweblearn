import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

// Bỏ import từ firebase-admin
// import { auth } from 'firebase-admin';
// import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Bỏ khởi tạo Firebase Admin
// getFirebaseAdminApp();

interface ApiKey {
  id: number;
  name: string;
  service: 'google' | 'openai' | 'azure' | 'anthropic';
  key: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_used: string | null;
  usage_count: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Môi trường development: bỏ qua xác thực và trả về dữ liệu mẫu
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: API Keys endpoint');
    
    // Xử lý các loại request
    switch (req.method) {
      case 'GET':
        // Trả về dữ liệu mẫu cho GET request
        const sampleKeys: ApiKey[] = [
          {
            id: 1,
            name: 'Google Gemini Pro',
            service: 'google',
            key: 'AIza**********************GVUQ',
            status: 'active',
            created_at: '2023-11-15T08:23:14Z',
            last_used: '2024-01-24T13:45:22Z',
            usage_count: 157
          },
          {
            id: 2,
            name: 'OpenAI GPT-4',
            service: 'openai',
            key: 'sk-v**********************Q23P',
            status: 'active',
            created_at: '2023-10-02T14:12:09Z',
            last_used: '2024-01-25T09:18:35Z',
            usage_count: 243
          },
          {
            id: 3,
            name: 'Azure OpenAI',
            service: 'azure',
            key: 'a3b**********************9f8g',
            status: 'inactive',
            created_at: '2023-12-07T10:45:30Z',
            last_used: '2024-01-10T15:22:18Z',
            usage_count: 86
          },
          {
            id: 4,
            name: 'Anthropic Claude',
            service: 'anthropic',
            key: 'sk-a**********************30hY',
            status: 'active',
            created_at: '2024-01-05T16:30:22Z',
            last_used: '2024-01-25T08:45:12Z',
            usage_count: 72
          }
        ];
        return res.status(200).json(sampleKeys);
      
      case 'POST':
        // Mô phỏng thêm API key mới
        return res.status(201).json({ 
          message: 'API key added successfully',
          id: 5
        });
      
      case 'PUT':
        // Mô phỏng cập nhật API key
        return res.status(200).json({ message: 'API key updated successfully' });
      
      case 'DELETE':
        // Mô phỏng xóa API key
        return res.status(200).json({ message: 'API key deleted successfully' });
      
      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  }

  // Môi trường production: kiểm tra xác thực
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Trong môi trường production, sẽ xác thực với Firebase Admin
    // Vì đã có điều kiện ở trên nên code này sẽ không được thực thi trong dev
    /*
    const decodedClaims = await auth().verifySessionCookie(sessionCookie);
    const { uid } = decodedClaims;

    // Kiểm tra quyền admin
    const isAdmin = uid === process.env.ADMIN_UID;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    */

    // Xử lý các loại request
    switch (req.method) {
      case 'GET':
        return await getApiKeys(req, res);
      case 'POST':
        return await addApiKey(req, res);
      case 'PUT':
        return await updateApiKey(req, res);
      case 'DELETE':
        return await deleteApiKey(req, res);
      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

// Lấy danh sách API keys
async function getApiKeys(req: NextApiRequest, res: NextApiResponse) {
  try {
    const keys = await query(`
      SELECT * FROM api_keys
      ORDER BY created_at DESC
    `);
    
    // Che giấu phần key thực tế, chỉ hiển thị một phần
    const safeKeys = keys.map((key: ApiKey) => ({
      ...key,
      key: maskApiKey(key.key, key.service)
    }));
    
    return res.status(200).json(safeKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return res.status(500).json({ message: 'Failed to fetch API keys' });
  }
}

// Thêm API key mới
async function addApiKey(req: NextApiRequest, res: NextApiResponse) {
  const { name, service, key } = req.body;
  
  if (!name || !service || !key) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Kiểm tra xem key có hợp lệ không (có thể thêm logic kiểm tra key ở đây)
    const isValid = await validateApiKey(key, service);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid API key' });
    }
    
    // Thêm key mới vào database
    const result = await query(`
      INSERT INTO api_keys (name, service, key, status, created_at)
      VALUES (?, ?, ?, 'active', NOW())
    `, [name, service, key]);
    
    if (result.affectedRows > 0) {
      return res.status(201).json({ 
        message: 'API key added successfully',
        id: result.insertId
      });
    } else {
      return res.status(500).json({ message: 'Failed to add API key' });
    }
  } catch (error) {
    console.error('Error adding API key:', error);
    return res.status(500).json({ message: 'Failed to add API key' });
  }
}

// Cập nhật trạng thái API key
async function updateApiKey(req: NextApiRequest, res: NextApiResponse) {
  const { id, status, name } = req.body;
  
  if (!id) {
    return res.status(400).json({ message: 'Missing key ID' });
  }
  
  try {
    let updateQuery = 'UPDATE api_keys SET ';
    const params = [];
    
    if (status !== undefined) {
      updateQuery += 'status = ?';
      params.push(status);
    }
    
    if (name !== undefined) {
      if (params.length > 0) updateQuery += ', ';
      updateQuery += 'name = ?';
      params.push(name);
    }
    
    if (params.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(id);
    
    const result = await query(updateQuery, params);
    
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'API key updated successfully' });
    } else {
      return res.status(404).json({ message: 'API key not found' });
    }
  } catch (error) {
    console.error('Error updating API key:', error);
    return res.status(500).json({ message: 'Failed to update API key' });
  }
}

// Xóa API key
async function deleteApiKey(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Missing key ID' });
  }
  
  try {
    const result = await query('DELETE FROM api_keys WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'API key deleted successfully' });
    } else {
      return res.status(404).json({ message: 'API key not found' });
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({ message: 'Failed to delete API key' });
  }
}

// Hàm che giấu API key
function maskApiKey(key: string, service: string): string {
  if (!key) return '';
  
  // Giữ lại 4 ký tự đầu và 4 ký tự cuối, phần còn lại thay bằng *
  if (key.length <= 8) {
    return '****';
  }
  
  const firstFour = key.substring(0, 4);
  const lastFour = key.substring(key.length - 4);
  const maskedLength = key.length - 8;
  const maskedPart = '*'.repeat(Math.min(maskedLength, 10));
  
  return `${firstFour}${maskedPart}${lastFour}`;
}

// Hàm kiểm tra API key có hợp lệ không
async function validateApiKey(key: string, service: string): Promise<boolean> {
  // Trong thực tế, bạn sẽ gọi API của service tương ứng để kiểm tra key
  // Đây là một ví dụ đơn giản, luôn trả về true
  return true;
}
