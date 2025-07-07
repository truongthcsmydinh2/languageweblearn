import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.users.findFirst({
      where: { firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      firebase_uid: user.firebase_uid,
      is_admin: user.is_admin,
      created_at: user.created_at,
      last_login: user.last_login
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 