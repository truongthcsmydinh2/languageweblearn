export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleDatabaseError = (error: any) => {
  console.error('Database Error:', error);
  
  if (error.code === 'PERMISSION_DENIED') {
    return new DatabaseError('Không có quyền truy cập dữ liệu', error.code);
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return new DatabaseError('Lỗi kết nối mạng', error.code);
  }
  
  return new DatabaseError('Có lỗi xảy ra khi truy cập database', error.code);
}; 