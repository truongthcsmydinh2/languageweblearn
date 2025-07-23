import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { word, meaning, type, example } = req.body;

  if (!word || !meaning) {
    return res.status(400).json({ message: 'Word and meaning are required' });
  }

  try {
    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    // Check if word already exists for this user
    const existingVocab = await prisma.vocabulary.findFirst({
      where: {
        userId: userId,
        word: word.toLowerCase()
      }
    });

    if (existingVocab) {
      return res.status(409).json({ message: 'Word already exists in your vocabulary' });
    }

    // Save new vocabulary
    const newVocab = await prisma.vocabulary.create({
      data: {
        userId: userId,
        word: word.toLowerCase(),
        meaning: meaning,
        type: type || 'unknown',
        example: example || null,
        createdAt: new Date()
      }
    });

    return res.status(201).json({
      message: 'Vocabulary saved successfully',
      vocabulary: newVocab
    });
  } catch (error) {
    console.error('Error saving vocabulary:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}