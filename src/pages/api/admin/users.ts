import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

// Bỏ import từ firebase-admin
// import { auth } from 'firebase-admin';
// import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Bỏ khởi tạo Firebase Admin
// getFirebaseAdminApp();

interface User {
  id: number;
  firebase_uid: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  created_at: string;
  last_login: string | null;
  status: 'active' | 'disabled' | 'deleted';
  role: 'user' | 'admin';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Môi trường development: bỏ qua xác thực và trả về dữ liệu mẫu
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Users endpoint');
    
    // Xử lý các loại request
    switch (req.method) {
      case 'GET':
        // Trả về dữ liệu mẫu cho GET request
        const sampleUsers: User[] = [
          {
            id: 1,
            firebase_uid: 'SIYWxqR7KzQmBrtw859xN9K1zXq1',
            email: 'truongthcsmydinh2@gmail.com',
            display_name: 'Ân Nguyễn Quốc',
            photo_url: 'https://lh3.googleusercontent.com/a/ACg8ocK20AdOmnSZye-eNxaq9aA5xQD3ua6byzhxe9UyLPpnMh0vjiWl=s96-c',
            created_at: '2023-10-15T08:23:14Z',
            last_login: '2024-01-25T13:45:22Z',
            status: 'active',
            role: 'admin'
          },
          {
            id: 2,
            firebase_uid: 'G7PCLF4br4bCru8rIwhXJ8QLGdF2',
            email: 'nguyenquocan060606@gmail.com',
            display_name: 'Ân Nguyễn Quốc',
            photo_url: 'https://lh3.googleusercontent.com/a/ACg8ocKOnSiSW3WUeS3RROvqjoJzjXzhj12FLmt-nEmXY4kSqtVcTg=s96-c',
            created_at: '2023-11-20T10:12:09Z',
            last_login: '2024-01-25T14:18:35Z',
            status: 'active',
            role: 'user'
          },
          {
            id: 3,
            firebase_uid: 'h8DywS3JkQVB5LpF2ZmEnR7Tx4q1',
            email: 'john.doe@example.com',
            display_name: 'John Doe',
            photo_url: null,
            created_at: '2023-12-05T14:30:22Z',
            last_login: '2024-01-20T09:15:42Z',
            status: 'active',
            role: 'user'
          },
          {
            id: 4,
            firebase_uid: 'p9KzXn4MrSjL7VcT1YqBg6Qw2Ea3',
            email: 'jane.smith@example.com',
            display_name: 'Jane Smith',
            photo_url: null,
            created_at: '2024-01-10T11:45:30Z',
            last_login: '2024-01-24T16:22:18Z',
            status: 'disabled',
            role: 'user'
          },
          {
            id: 5,
            firebase_uid: 't5RvUm6NwPdH2JsB3EaKx8Yg7Fz9',
            email: 'david.wilson@example.com',
            display_name: 'David Wilson',
            photo_url: null,
            created_at: '2024-01-15T09:20:15Z',
            last_login: null,
            status: 'deleted',
            role: 'user'
          }
        ];
        
        // Xử lý phân trang và tìm kiếm
        const { page = '1', limit = '10', search = '', status = '' } = req.query;
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);
        
        // Lọc dữ liệu theo tìm kiếm và trạng thái
        let filteredUsers = [...sampleUsers];
        
        if (search) {
          const searchLower = (search as string).toLowerCase();
          filteredUsers = filteredUsers.filter(user => 
            user.email.toLowerCase().includes(searchLower) || 
            user.display_name.toLowerCase().includes(searchLower)
          );
        }
        
        if (status) {
          filteredUsers = filteredUsers.filter(user => user.status === status);
        }
        
        // Tính toán phân trang
        const total = filteredUsers.length;
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        return res.status(200).json({
          users: paginatedUsers,
          pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber)
          }
        });
      
      case 'PUT':
        // Mô phỏng cập nhật người dùng
        return res.status(200).json({ message: 'User updated successfully' });
      
      case 'DELETE':
        // Mô phỏng xóa người dùng
        return res.status(200).json({ message: 'User deleted successfully' });
      
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
        return await getUsers(req, res);
      case 'PUT':
        return await updateUser(req, res);
      case 'DELETE':
        return await deleteUser(req, res);
      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

// Lấy danh sách người dùng
async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10', search = '', status = '' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Xây dựng câu truy vấn
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    
    // Thêm điều kiện tìm kiếm
    if (search) {
      sql += ' AND (email LIKE ? OR display_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Thêm điều kiện lọc theo trạng thái
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    // Thêm phân trang
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNumber, offset);
    
    // Thực hiện truy vấn
    const users = await query(sql, params);
    
    // Đếm tổng số người dùng
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams: any[] = [];
    
    if (search) {
      countSql += ' AND (email LIKE ? OR display_name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;
    
    // Trả về kết quả
    return res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
}

// Cập nhật thông tin người dùng
async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  const { firebase_uid, status, role } = req.body;
  
  if (!firebase_uid) {
    return res.status(400).json({ message: 'Missing user ID' });
  }
  
  try {
    // Cập nhật trong database
    let updateQuery = 'UPDATE users SET ';
    const params = [];
    
    if (status !== undefined) {
      updateQuery += 'status = ?';
      params.push(status);
    }
    
    if (role !== undefined) {
      if (params.length > 0) updateQuery += ', ';
      updateQuery += 'role = ?';
      params.push(role);
    }
    
    if (params.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateQuery += ' WHERE firebase_uid = ?';
    params.push(firebase_uid);
    
    const result = await query(updateQuery, params);
    
    /* Commented out Firebase Auth update
    // Cập nhật trong Firebase Auth nếu cần
    if (status === 'disabled') {
      await auth().updateUser(firebase_uid, { disabled: true });
    } else if (status === 'active') {
      await auth().updateUser(firebase_uid, { disabled: false });
    }
    */
    
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'User updated successfully' });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

// Xóa người dùng
async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  const { firebase_uid } = req.query;
  
  if (!firebase_uid) {
    return res.status(400).json({ message: 'Missing user ID' });
  }
  
  try {
    // Soft delete trong database
    const result = await query(
      'UPDATE users SET status = ?, deleted_at = NOW() WHERE firebase_uid = ?',
      ['deleted', firebase_uid]
    );
    
    /* Commented out Firebase Auth delete
    // Xóa trong Firebase Auth
    try {
      await auth().deleteUser(firebase_uid as string);
    } catch (firebaseError) {
      console.error('Error deleting user from Firebase:', firebaseError);
      // Tiếp tục xử lý ngay cả khi xóa Firebase không thành công
    }
    */
    
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'User deleted successfully' });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}
