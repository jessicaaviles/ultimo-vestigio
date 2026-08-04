import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { ensureUserAlias, generateUniqueAlias } from '../services/userAlias';

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response) => {
  try {
    const { displayName } = req.body;
    
    // Generate a unique token for the device
    const deviceToken = crypto.randomUUID();
    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    const user = await prisma.anonymous_users.create({
      data: {
        device_token_hash: deviceTokenHash,
        default_display_name: displayName,
        alias: await generateUniqueAlias(prisma, displayName || 'investigador'),
      }
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        deviceToken: deviceToken, // Only sent once!
        displayName: user.default_display_name,
        alias: user.alias,
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const validateUser = async (req: Request, res: Response) => {
  try {
    const { deviceToken } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({ success: false, error: 'Device token required' });
    }

    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    const foundUser = await prisma.anonymous_users.findUnique({
      where: {
        device_token_hash: deviceTokenHash
      }
    });

    if (!foundUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = await ensureUserAlias(prisma, foundUser);

    res.json({
      success: true,
      data: {
        userId: user.id,
        displayName: user.default_display_name,
        alias: user.alias,
      }
    });
  } catch (error) {
    console.error('Error validating user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
