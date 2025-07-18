import { NextApiRequest, NextApiResponse } from 'next';
import { logWithTimestamp, logErrorWithTimestamp } from '@/utils/logger';
import { 
  getProtectionStatus, 
  resetCircuitBreaker,
  getRateLimiterStatus,
  getCircuitBreakerStatus 
} from '@/utils/rateLimiter';

/**
 * API endpoint để monitor và quản lý trạng thái Gemini API protection
 * GET: Lấy trạng thái hiện tại
 * POST: Reset circuit breaker hoặc thực hiện các hành động quản lý
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestId = `gemini_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logWithTimestamp(`🔍 [${requestId}] Gemini status API called - Method: ${req.method}`);
    
    if (req.method === 'GET') {
      // Lấy trạng thái protection
      const status = getProtectionStatus();
      const detailedStatus = {
        timestamp: new Date().toISOString(),
        rateLimiter: {
          ...getRateLimiterStatus(),
          description: 'Rate limiting to prevent API spam'
        },
        circuitBreaker: {
          ...getCircuitBreakerStatus(),
          description: 'Circuit breaker to handle API failures'
        },
        health: {
          isHealthy: status.circuitBreaker.state === 'CLOSED' && status.circuitBreaker.failures === 0,
          issues: []
        }
      };
      
      // Phân tích các vấn đề tiềm ẩn
      if (status.circuitBreaker.state === 'OPEN') {
        detailedStatus.health.isHealthy = false;
        detailedStatus.health.issues.push('Circuit breaker is OPEN - API calls are being blocked');
        logWithTimestamp('Circuit breaker is OPEN - API calls are being blocked');
      }
      
      if (status.circuitBreaker.failures > 0) {
        detailedStatus.health.issues.push(`${status.circuitBreaker.failures} recent failures detected`);
        logWithTimestamp(`${status.circuitBreaker.failures} recent failures detected`);
      }
      
      if (status.rateLimiter.activeRequests >= status.rateLimiter.maxRequests * 0.8) {
        detailedStatus.health.issues.push('Rate limiter approaching limit');
        logWithTimestamp('Rate limiter approaching limit');
      }
      
      logWithTimestamp(`📊 [${requestId}] Status retrieved:`, {
        circuitState: status.circuitBreaker.state,
        failures: status.circuitBreaker.failures,
        activeRequests: status.rateLimiter.activeRequests,
        isHealthy: detailedStatus.health.isHealthy
      });
      
      return res.status(200).json(detailedStatus);
      
    } else if (req.method === 'POST') {
      const { action } = req.body;
      
      logWithTimestamp(`🔧 [${requestId}] Admin action requested: ${action}`);
      
      switch (action) {
        case 'reset_circuit_breaker':
          resetCircuitBreaker();
          logWithTimestamp(`✅ [${requestId}] Circuit breaker reset by admin`);
          
          return res.status(200).json({
            success: true,
            message: 'Circuit breaker has been reset',
            timestamp: new Date().toISOString(),
            newStatus: getProtectionStatus()
          });
          
        case 'get_detailed_status':
          const detailedStatus = {
            timestamp: new Date().toISOString(),
            protection: getProtectionStatus(),
            system: {
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              nodeVersion: process.version
            },
            recommendations: []
          };
          
          // Thêm các khuyến nghị dựa trên trạng thái
          const protection = detailedStatus.protection;
          if (protection.circuitBreaker.state === 'OPEN') {
            detailedStatus.recommendations.push('Consider resetting circuit breaker if issues are resolved');
            logWithTimestamp('Consider resetting circuit breaker if issues are resolved');
          }
          
          if (protection.circuitBreaker.failures > 3) {
            detailedStatus.recommendations.push('Investigate recent API failures');
            logWithTimestamp('Investigate recent API failures');
          }
          
          if (protection.rateLimiter.activeRequests > 8) {
            detailedStatus.recommendations.push('High API usage detected - monitor for potential issues');
            logWithTimestamp('High API usage detected - monitor for potential issues');
          }
          
          return res.status(200).json(detailedStatus);
          
        default:
          logErrorWithTimestamp(`❌ [${requestId}] Unknown action: ${action}`);
          return res.status(400).json({
            error: 'Unknown action',
            availableActions: ['reset_circuit_breaker', 'get_detailed_status']
          });
      }
      
    } else {
      logErrorWithTimestamp(`❌ [${requestId}] Method not allowed: ${req.method}`);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    logErrorWithTimestamp(`❌ [${requestId}] Error in gemini status API:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      detail: String(error),
      requestId 
    });
  }
}

// Export helper function để sử dụng trong các API khác
export function getGeminiHealthStatus() {
  const status = getProtectionStatus();
  return {
    isHealthy: status.circuitBreaker.state === 'CLOSED' && status.circuitBreaker.failures === 0,
    circuitState: status.circuitBreaker.state,
    failures: status.circuitBreaker.failures,
    rateLimitUsage: `${status.rateLimiter.activeRequests}/${status.rateLimiter.maxRequests}`
  };
}