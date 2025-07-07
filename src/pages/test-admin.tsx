import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TestAdminPage = () => {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'firebase_uid': user?.uid || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Admin Access</h1>
        
        <div className="bg-gray-700 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">User Info</h2>
          <div className="space-y-2 text-gray-200">
            <p><strong>Firebase UID:</strong> {user?.uid || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Display Name:</strong> {user?.displayName || 'N/A'}</p>
            <p><strong>Is Admin (from context):</strong> {user?.is_admin ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {userData && (
          <div className="bg-gray-700 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Database User Info</h2>
            <div className="space-y-2 text-gray-200">
              <p><strong>Database ID:</strong> {userData.id}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Display Name:</strong> {userData.display_name}</p>
              <p><strong>Firebase UID:</strong> {userData.firebase_uid}</p>
              <p><strong>Is Admin:</strong> {userData.is_admin ? 'Yes' : 'No'}</p>
              <p><strong>Created At:</strong> {userData.created_at}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Admin Access Test</h2>
          <div className="space-y-4">
            <a 
              href="/admin/ielts-reading" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Go to IELTS Reading Admin
            </a>
            <br />
            <a 
              href="/admin" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Go to Main Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAdminPage; 