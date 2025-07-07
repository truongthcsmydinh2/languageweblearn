// src/lib/websocket.ts
// Cấu hình WebSocket cho HMR

export const getWebSocketUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname;
  const port = process.env.NEXT_PUBLIC_WS_PORT || '3030';
  
  return `${protocol}//${host}:${port}/_next/webpack-hmr`;
};

export const initWebSocket = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const wsUrl = getWebSocketUrl();
  if (!wsUrl) {
    console.warn('WebSocket URL không hợp lệ');
    return;
  }

  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      // WebSocket connected successfully
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'hash') {
          // Xử lý HMR update
        }
      } catch (error) {
        console.warn('Lỗi xử lý WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.warn('WebSocket HMR lỗi:', error);
    };
    
    ws.onclose = () => {
      // Thử kết nối lại sau 5 giây
      setTimeout(() => {
        initWebSocket();
      }, 5000);
    };
    
    return ws;
  } catch (error) {
    console.error('Lỗi khởi tạo WebSocket:', error);
  }
}; 