import React from 'react';
import useRequireAuth from '@/hooks/useRequireAuth';
import GeminiStatusMonitor from '@/components/admin/GeminiStatusMonitor';
import Navbar from '@/components/Navbar';

const SystemMonitorPage: React.FC = () => {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🔧 System Monitor</h1>
          <p className="text-gray-600">
            Monitor and manage the health of Gemini API integration and system protection mechanisms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gemini API Status */}
          <div className="lg:col-span-2">
            <GeminiStatusMonitor refreshInterval={30000} />
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-semibold">{process.env.NODE_ENV || 'development'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Time:</span>
                <span className="font-semibold">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User:</span>
                <span className="font-semibold">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh Page
              </button>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to clear browser cache?')) {
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        names.forEach(name => {
                          caches.delete(name);
                        });
                      });
                    }
                    window.location.reload();
                  }
                }}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                🗑️ Clear Cache
              </button>
              <a 
                href="/admin"
                className="block w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center"
              >
                ← Back to Admin
              </a>
            </div>
          </div>

          {/* Health Indicators */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🏥 Health Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💚</span>
                  <div>
                    <h3 className="font-semibold text-green-800">API Health</h3>
                    <p className="text-sm text-green-600">Monitored by circuit breaker</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🚦</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">Rate Limiting</h3>
                    <p className="text-sm text-blue-600">Prevents API spam</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="font-semibold text-purple-800">Protection</h3>
                    <p className="text-sm text-purple-600">Automatic error handling</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📚 Documentation</h2>
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Circuit Breaker States:</h3>
              <ul className="space-y-1 mb-4">
                <li><strong>CLOSED (✅):</strong> Normal operation, requests are allowed</li>
                <li><strong>OPEN (🚫):</strong> Too many failures, requests are blocked</li>
                <li><strong>HALF_OPEN (⚠️):</strong> Testing if service has recovered</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2">Rate Limiter:</h3>
              <ul className="space-y-1 mb-4">
                <li>Limits API requests to prevent spam and quota exhaustion</li>
                <li>Current limit: 10 requests per minute</li>
                <li>Automatically queues requests when limit is reached</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2">Troubleshooting:</h3>
              <ul className="space-y-1">
                <li>If circuit breaker is OPEN, check recent errors and consider resetting</li>
                <li>High rate limit usage may indicate heavy system load</li>
                <li>Monitor for repeating patterns in API responses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitorPage;