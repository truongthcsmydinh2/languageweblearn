import { db } from './mysql';

/**
 * Thực hiện truy vấn SQL với các tham số
 * @param sql Câu lệnh SQL
 * @param params Các tham số cho câu lệnh SQL (tùy chọn)
 * @returns Promise với kết quả truy vấn
 */
export async function query(sql: string, params: any[] = []): Promise<any> {
  try {
    const [results] = await db.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Thực hiện nhiều truy vấn trong một transaction
 * @param queries Mảng các đối tượng {sql, params}
 * @returns Promise với kết quả của tất cả các truy vấn
 */
export async function transaction(queries: { sql: string; params: any[] }[]): Promise<any[]> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default {
  query,
  transaction
}; 