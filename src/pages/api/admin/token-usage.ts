import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

interface TokenUsage {
  date: string;
  service: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  apiCalls: number;
}

interface MonthlyUsage {
  month: string;
  totalTokens: number;
  totalCost: number;
  services: {
    [key: string]: {
      tokensIn: number;
      tokensOut: number;
      cost: number;
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Môi trường development: trả về dữ liệu mẫu
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Token Usage endpoint');
    
    const { timeRange = 'week', serviceFilter = 'all' } = req.query;
    
    // Tạo dữ liệu mẫu cho sử dụng hàng ngày
    const today = new Date();
    const dummyDailyData: TokenUsage[] = Array(30).fill(0).map((_, index) => {
      const date = new Date();
      date.setDate(today.getDate() - index);
      
      // Tạo ngẫu nhiên số lượng token và chi phí
      const tokensIn = Math.floor(Math.random() * 1000) + 500;
      const tokensOut = Math.floor(Math.random() * 500) + 200;
      
      let service = 'google';
      if (index % 4 === 1) service = 'openai';
      if (index % 4 === 2) service = 'huggingface';
      if (index % 4 === 3) service = 'anthropic';
      
      // Tính chi phí dựa trên service và số lượng token
      let costRate = 0;
      if (service === 'google') costRate = 0.0005;
      if (service === 'openai') costRate = 0.001;
      if (service === 'huggingface') costRate = 0.0003;
      if (service === 'anthropic') costRate = 0.0015;
      
      const cost = ((tokensIn * costRate) + (tokensOut * costRate * 1.5));
      
      return {
        date: date.toISOString().split('T')[0],
        service,
        tokensIn,
        tokensOut,
        cost,
        apiCalls: Math.floor(Math.random() * 10) + 1
      };
    });
    
    // Lọc theo service nếu có
    const filteredData = serviceFilter !== 'all' ? 
      dummyDailyData.filter(item => item.service === serviceFilter) : 
      dummyDailyData;
    
    // Lọc theo thời gian
    let timeRangeInDays = 30;
    if (timeRange === 'day') timeRangeInDays = 1;
    if (timeRange === 'week') timeRangeInDays = 7;
    if (timeRange === 'month') timeRangeInDays = 30;
    
    const timeLimitedData = filteredData.slice(0, timeRangeInDays);
    
    // Tạo dữ liệu tổng hợp theo tháng
    const months = ['01', '02', '03', '04', '05', '06'];
    const monthlyData: MonthlyUsage[] = months.map(month => {
      const year = new Date().getFullYear();
      
      // Tạo số ngẫu nhiên cho dữ liệu mẫu
      const googleTokensIn = Math.floor(Math.random() * 20000) + 5000;
      const googleTokensOut = Math.floor(Math.random() * 10000) + 2000;
      const googleCost = Math.random() * 40 + 10;
      
      const openaiTokensIn = Math.floor(Math.random() * 15000) + 3000;
      const openaiTokensOut = Math.floor(Math.random() * 7000) + 1000;
      const openaiCost = Math.random() * 30 + 15;
      
      const huggingfaceTokensIn = Math.floor(Math.random() * 10000) + 2000;
      const huggingfaceTokensOut = Math.floor(Math.random() * 5000) + 1000;
      const huggingfaceCost = Math.random() * 20 + 5;
      
      const anthropicTokensIn = Math.floor(Math.random() * 8000) + 1000;
      const anthropicTokensOut = Math.floor(Math.random() * 4000) + 500;
      const anthropicCost = Math.random() * 25 + 10;
      
      // Tính tổng
      const totalTokens = googleTokensIn + googleTokensOut + 
                           openaiTokensIn + openaiTokensOut + 
                           huggingfaceTokensIn + huggingfaceTokensOut + 
                           anthropicTokensIn + anthropicTokensOut;
      
      const totalCost = googleCost + openaiCost + huggingfaceCost + anthropicCost;
      
      return {
        month: `${year}-${month}`,
        totalTokens,
        totalCost,
        services: {
          google: {
            tokensIn: googleTokensIn,
            tokensOut: googleTokensOut,
            cost: googleCost
          },
          openai: {
            tokensIn: openaiTokensIn,
            tokensOut: openaiTokensOut,
            cost: openaiCost
          },
          huggingface: {
            tokensIn: huggingfaceTokensIn,
            tokensOut: huggingfaceTokensOut,
            cost: huggingfaceCost
          },
          anthropic: {
            tokensIn: anthropicTokensIn,
            tokensOut: anthropicTokensOut,
            cost: anthropicCost
          }
        }
      };
    });
    
    return res.status(200).json({
      dailyUsage: timeLimitedData,
      monthlyUsage: monthlyData
    });
  }

  // Môi trường production: lấy dữ liệu thực từ database
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { timeRange = 'week', serviceFilter = 'all' } = req.query;
    
    // Tính toán ngày bắt đầu dựa trên timeRange
    let startDate = new Date();
    if (timeRange === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Query cho dữ liệu hàng ngày
    let dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        service,
        SUM(tokens_in) as tokensIn,
        SUM(tokens_out) as tokensOut,
        SUM(cost) as cost,
        COUNT(*) as apiCalls
      FROM token_usage 
      WHERE created_at >= ?
    `;
    
    const queryParams = [startDate.toISOString().split('T')[0]];
    
    if (serviceFilter !== 'all') {
      dailyQuery += ' AND service = ?';
      queryParams.push(serviceFilter as string);
    }
    
    dailyQuery += ' GROUP BY DATE(created_at), service ORDER BY date DESC';
    
    const dailyUsage = await query(dailyQuery, queryParams);
    
    // Query cho dữ liệu tháng
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        service,
        SUM(tokens_in) as tokensIn,
        SUM(tokens_out) as tokensOut,
        SUM(cost) as cost
      FROM token_usage 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), service
      ORDER BY month DESC
    `;
    
    const monthlyData = await query(monthlyQuery);
    
    // Xử lý dữ liệu monthly để group theo tháng
    const monthlyUsage: MonthlyUsage[] = [];
    const monthlyMap = new Map();
    
    monthlyData.forEach((row: any) => {
      if (!monthlyMap.has(row.month)) {
        monthlyMap.set(row.month, {
          month: row.month,
          totalTokens: 0,
          totalCost: 0,
          services: {
            google: { tokensIn: 0, tokensOut: 0, cost: 0 },
            openai: { tokensIn: 0, tokensOut: 0, cost: 0 },
            huggingface: { tokensIn: 0, tokensOut: 0, cost: 0 },
            anthropic: { tokensIn: 0, tokensOut: 0, cost: 0 }
          }
        });
      }
      
      const monthData = monthlyMap.get(row.month);
      monthData.totalTokens += row.tokensIn + row.tokensOut;
      monthData.totalCost += row.cost;
      
      if (monthData.services[row.service]) {
        monthData.services[row.service].tokensIn += row.tokensIn;
        monthData.services[row.service].tokensOut += row.tokensOut;
        monthData.services[row.service].cost += row.cost;
      }
    });
    
    monthlyUsage.push(...Array.from(monthlyMap.values()));
    
    return res.status(200).json({
      dailyUsage,
      monthlyUsage
    });
    
  } catch (error) {
    console.error('Error fetching token usage:', error);
    return res.status(500).json({ message: 'Failed to fetch token usage data' });
  }
}