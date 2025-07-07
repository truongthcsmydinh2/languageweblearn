import * as admin from 'firebase-admin';

// Biến để lưu trữ instance của Firebase Admin
let firebaseAdmin: admin.app.App;

// Cấu hình mặc định cho môi trường phát triển
const defaultConfig = {
  projectId: "my-app-8e5dc", 
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCm6F7+TvZX1O4c\nXU5Iu3rt3XcbEUvFW6xfDRxWvC9ZwwViCHWOTuXYPAD890T57yCen1D0m8Bx3JW6\n49gLu2pMKJ4JqDcY5cLJXYJf4b5L+J9M7U/KE/YjFGJaHsKA+g89m/HhPa3zxH9O\ngc3BEkU+fZ0iHqkwxe5LH/Qmf4AvPITwGOlgkTUMnQRqTEKyA3vc6ZFvwAaOhMGy\nhM+CpR0tPQPfvIP4+j9iGgPJWpTr41SmRc9UPFkaDXeQUjjwBe6PzTt3g5E0MZAw\nNn8ryKs4wuGK/d+cXx3SrkcWgHkfKvMxK1t9iRZCnmCh55/LIRcFy9CG8QN/+O80\nvXpHh22xAgMBAAECggEAEG8GYTxw/n1jKnkI2AV0KWnA6FIzkTm5ufmIGQDwKNuG\nqjMqzvkLXSn29FZnPKHtxS0v6tvbwXH3mMpDJ6yYOaWYyQfC05nsJYWUXfKHdqWp\nBpA5CaQcGgmRLWJx/j8WPli60Z02rZZ2vqqYr1iuYnFAF9iH5MHr1ljZZjK0Zl5h\nA9plfZLPd5C0q0jYQvGmQwOrOo6nI9NwuYzPILQxdSuZZ0EfHvtR4vfwt06Uvpbt\nsdilOyb-dGhjIl7Gv/wc8GV55f54w022qRQo3WG8NdHJzlnX3S2PiHi0hLpKvtBD\n/9xWdGBpMlbG2oAZUx9PjXojD1GA4/jR3eGI2iYG2QKBgQDebmUmSh38wkF84+XD\nxe8bBb7rF7Uv07OdNlHbBQ3CtQwvGUDZ0FPb0USIw3kI3gvppDJ1a8F4C0iKA47z\nyHEpLIEBEKiVkq4nHa5NcIAGJhA+60Tc6iGpyzjJcMd94dRJMSQh+FRCh4hZjLzx\ntupXoPYlhQbx5GqNTkGPgxQ0VQKBgQDARbdLP2Ky6mqu1/oLEEJ9vujzZ8cT8kzA\niTA1hOmZJmkBjjGiqsKfpn56XTnkjmCMyV8W4uGGHkOcZ4XHZa+qelLZn92OzOG5\nLMAbPzYrlE6KQOYVHhcKtCMlnVHNoxU1Y45P2lUV+GdDNQ2p0+XvOeYIwEJb8W/G\npuUXyUb/LQKBgQDTf39vIb4hBBCDKQ2XEUYy5aJXkAR1d3RZw+a9MujxF14Xrl0e\n3M8xtUEC0TePmzU4xbVy5tNJvgzh4jw2O4hJwCyEhJavIV0nTnQmYTTMoTXGGcmP\nsA8XzEtmHi4bGXSqQ4RqXnj9jEJz6TKlV1kL4o1EJzuJPvkLfcQO/1dsPQKBgAl6\n6WPsHQrP/UQwWFwQJ6mqDYYgzexeXJQSGGnA+yg97LnZO94dVL9qoRfYZWlMzr2L\nUF1/p9FwOCjS4WsG5gQLff4zcAQKvT9fFs+7q9iHfI17FVpZ2yVPPOTiQzJ+e8L4\nxG8szsFRxJRQKNRJTkxOZ5yxu4RRKn1eJvrzcPbhAoGAdLVTIeVrp02XPJJpYHXV\ngBZIRlH3g03R687BbHHSJ2Sj9d7UU3FO05v5ZehJA3mZ2/AS+QXQe75JSIcCsUGK\nKB82xfTR3skWGz4kjJYR242a82/Md/bxNJV3TM+JhE0kzr7ez1ljPFcxpD6yQQD6\n3CQvV8MjmzQVLxF6GPKq/sQ=\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-7qhle@my-app-8e5dc.iam.gserviceaccount.com"
};

// Hàm khởi tạo Firebase Admin SDK
export function getFirebaseAdminApp(): admin.app.App {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Kiểm tra xem đã có app nào được khởi tạo chưa
  const apps = admin.apps;
  if (apps.length > 0 && apps[0]) {
    return apps[0];
  }

  // Khởi tạo app mới
  try {
    // Cấu hình cho Firebase Admin
    const config: admin.AppOptions = {
      // Trong môi trường phát triển, chỉ cần cung cấp databaseURL
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://my-app-8e5dc-default-rtdb.asia-southeast1.firebasedatabase.app',
    };

    // Khởi tạo app mà không cần credential trong môi trường phát triển
    firebaseAdmin = admin.initializeApp(config);
    return firebaseAdmin;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Export các services
export const getAuth = () => {
  getFirebaseAdminApp();
  return admin.auth();
};

export const getFirestore = () => {
  getFirebaseAdminApp();
  return admin.firestore();
};

export const getDatabase = () => {
  getFirebaseAdminApp();
  return admin.database();
};

export default {
  getFirebaseAdminApp,
  getAuth,
  getFirestore,
  getDatabase
}; 