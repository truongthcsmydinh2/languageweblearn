import React, { useState, useEffect } from 'react';
import { logWithTimestamp } from '@/utils/logger';

interface ProtectionStatus {
  rateLimiter: {
    activeRequests: number;
    maxRequests: number;
    windowMs: number;
    description: string;
  };
  circuitBreaker: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailureTime: number;
    recentErrors: string[];
    description: string;
  };
  health: {
    isHealthy: boolean;
    issues: string[];
  };
  timestamp: string;
}

interface GeminiStatusMonitorProps {
  refreshInterval?: number; // milliseconds
}

const GeminiStatusMonitor: React.FC<GeminiStatusMonitorProps> = ({ 
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [status, setStatus] = useState<ProtectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/gemini-status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
      logWithTimestamp('📊 Gemini status updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logWithTimestamp('❌ Failed to fetch Gemini status:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetCircuitBreaker = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/gemini-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset_circuit_breaker' }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      logWithTimestamp('✅ Circuit breaker reset successfully:', result.message);
      
      // Refresh status after reset
      await fetchStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to reset circuit breaker: ${errorMessage}`);
      logWithTimestamp('❌ Failed to reset circuit breaker:', errorMessage);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getCircuitStateColor = (state: string) => {
    switch (state) {
      case 'CLOSED': return 'text-green-600';
      case 'OPEN': return 'text-red-600';
      case 'HALF_OPEN': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getCircuitStateIcon = (state: string) => {
    switch (state) {
      case 'CLOSED': return '✅';
      case 'OPEN': return '🚫';
      case 'HALF_OPEN': return '⚠️';
      default: return '❓';
    }
  };

  const getRateLimitPercentage = () => {
    if (!status) return 0;
    return (status.rateLimiter.activeRequests / status.rateLimiter.maxRequests) * 100;
  };

  const getRateLimitColor = () => {
    const percentage = getRateLimitPercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">🤖 Gemini API Status</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </button>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {status && (
        <div className="space-y-6">
          {/* Overall Health */}
          <div className={`p-4 rounded-lg ${
            status.health.isHealthy 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {status.health.isHealthy ? '💚' : '❤️‍🩹'}
              </span>
              <h3 className="font-semibold">
                System Health: {status.health.isHealthy ? 'Healthy' : 'Issues Detected'}
              </h3>
            </div>
            {status.health.issues.length > 0 && (
              <ul className="mt-2 space-y-1">
                {status.health.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-700">• {issue}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Circuit Breaker Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <span>{getCircuitStateIcon(status.circuitBreaker.state)}</span>
              <span>Circuit Breaker</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">State</p>
                <p className={`font-semibold ${getCircuitStateColor(status.circuitBreaker.state)}`}>
                  {status.circuitBreaker.state}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failures</p>
                <p className={`font-semibold ${
                  status.circuitBreaker.failures > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {status.circuitBreaker.failures}
                </p>
              </div>
            </div>
            
            {status.circuitBreaker.recentErrors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-1">Recent Errors:</p>
                <ul className="text-xs space-y-1">
                  {status.circuitBreaker.recentErrors.map((error, index) => (
                    <li key={index} className="text-red-600 bg-red-50 p-1 rounded">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {status.circuitBreaker.state === 'OPEN' && (
              <button
                onClick={resetCircuitBreaker}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                🔄 Reset Circuit Breaker
              </button>
            )}
          </div>

          {/* Rate Limiter Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">🚦 Rate Limiter</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Active Requests</span>
                  <span>{status.rateLimiter.activeRequests}/{status.rateLimiter.maxRequests}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getRateLimitColor()}`}
                    style={{ width: `${getRateLimitPercentage()}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Window: {status.rateLimiter.windowMs / 1000}s
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center">
            Last updated: {lastUpdated?.toLocaleString() || 'Never'}
            {status.timestamp && (
              <span className="ml-2">
                (Server: {new Date(status.timestamp).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiStatusMonitor;