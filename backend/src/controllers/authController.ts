import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { LoginTicket, TokenPayload } from 'google-auth-library';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClientIds = String(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const googleClient = new OAuth2Client();

const prisma = new PrismaClient();

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return hash === key;
}

function createAuthToken() {
  const authToken = crypto.randomUUID();
  const authTokenHash = crypto.createHash('sha256').update(authToken).digest('hex');
  return { authToken, authTokenHash };
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios.' });
    if (String(password).length < 6) return res.status(400).json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.anonymous_users.findUnique({ where: { email: normalizedEmail } });
    if (existing && !existing.deleted_at) return res.status(409).json({ success: false, error: 'Este email já está cadastrado.' });

    const deviceToken = crypto.randomUUID();
    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');
    const { authToken, authTokenHash } = createAuthToken();

    const user = existing
      ? await prisma.anonymous_users.update({
          where: { id: existing.id },
          data: {
            device_token_hash: deviceTokenHash,
            email: normalizedEmail,
            password_hash: hashPassword(String(password)),
            auth_token_hash: authTokenHash,
            default_display_name: displayName || existing.default_display_name || 'Investigador',
            profile_active: true,
            profile_photo_data: null,
            generated_profile_photo_data: null,
            portrait_generations: 0,
            profile_photo_updated_at: null,
            onboarding_completed: false,
            deleted_at: null,
            last_active_at: new Date(),
          }
        })
      : await prisma.anonymous_users.create({
          data: {
            device_token_hash: deviceTokenHash,
            email: normalizedEmail,
            password_hash: hashPassword(String(password)),
            auth_token_hash: authTokenHash,
            default_display_name: displayName || 'Investigador',
          }
        });

    res.json({
      success: true,
      data: {
        userId: user.id,
        authToken,
        displayName: user.default_display_name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao registrar.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios.' });

    const user = await prisma.anonymous_users.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!user || user.deleted_at || !user.password_hash) return res.status(401).json({ success: false, error: 'Email ou senha inválidos.' });
    if (!verifyPassword(String(password), user.password_hash)) return res.status(401).json({ success: false, error: 'Email ou senha inválidos.' });

    const { authToken, authTokenHash } = createAuthToken();
    await prisma.anonymous_users.update({ where: { id: user.id }, data: { auth_token_hash: authTokenHash, last_active_at: new Date() } });

    res.json({
      success: true,
      data: {
        userId: user.id,
        authToken,
        displayName: user.default_display_name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao fazer login.' });
  }
};

export const linkProfile = async (req: Request, res: Response) => {
  try {
    const { email, password, anonymousUserId } = req.body;
    if (!email || !password || !anonymousUserId) return res.status(400).json({ success: false, error: 'Email, senha e ID do perfil são obrigatórios.' });

    const existing = await prisma.anonymous_users.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (existing) return res.status(409).json({ success: false, error: 'Este email já está cadastrado.' });

    const user = await prisma.anonymous_users.findUnique({ where: { id: String(anonymousUserId) } });
    if (!user) return res.status(404).json({ success: false, error: 'Perfil não encontrado.' });

    const { authToken, authTokenHash } = createAuthToken();

    await prisma.anonymous_users.update({
      where: { id: user.id },
      data: {
        email: String(email).toLowerCase().trim(),
        password_hash: hashPassword(String(password)),
        auth_token_hash: authTokenHash,
      }
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        authToken,
        displayName: user.default_display_name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error linking profile:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao vincular perfil.' });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Token não fornecido.' });

    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.anonymous_users.findFirst({ where: { auth_token_hash: tokenHash, deleted_at: null } });
    if (!user) return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });

    res.json({
      success: true,
      data: {
        userId: user.id,
        displayName: user.default_display_name,
        email: user.email,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno ao validar token.' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential, displayName } = req.body;
    if (!credential) return res.status(400).json({ success: false, error: 'Credencial do Google é obrigatória.' });

    if (googleClientIds.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Login com Google não configurado no servidor. Defina GOOGLE_CLIENT_ID (ou GOOGLE_WEB_CLIENT_ID) no ambiente do backend.',
      });
    }

    let ticket: LoginTicket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: String(credential),
        audience: googleClientIds,
      });
    } catch (verifyError) {
      console.error('Google token verification error:', verifyError);
      return res.status(401).json({
        success: false,
        error: 'Falha ao validar o token do Google. Confirme se o Client ID web usado no Vercel é o mesmo aceito no Render.',
      });
    }

    const payload = ticket.getPayload() as TokenPayload | undefined;
    if (!payload || !payload.email) return res.status(401).json({ success: false, error: 'Token do Google inválido.' });
    if (payload.email_verified === false) return res.status(401).json({ success: false, error: 'O Google não confirmou este email.' });

    const email = payload.email.toLowerCase().trim();
    let user = await prisma.anonymous_users.findUnique({ where: { email } });
    const { authToken, authTokenHash } = createAuthToken();

    if (user && !user.deleted_at) {
      await prisma.anonymous_users.update({
        where: { id: user.id },
        data: { auth_token_hash: authTokenHash, last_active_at: new Date() },
      });
      return res.json({
        success: true, data: { userId: user.id, authToken, displayName: user.default_display_name, email: user.email },
      });
    }

    if (user && user.deleted_at) {
      user = await prisma.anonymous_users.update({
        where: { id: user.id },
        data: {
          email,
          auth_token_hash: authTokenHash,
          default_display_name: displayName || payload.name || user.default_display_name || 'Investigador',
          deleted_at: null,
          profile_active: true,
          password_hash: null,
          generated_profile_photo_data: null,
          portrait_generations: 0,
          profile_photo_updated_at: null,
          onboarding_completed: false,
          last_active_at: new Date(),
        },
      });

      return res.json({
        success: true, data: { userId: user.id, authToken, displayName: user.default_display_name, email: user.email },
      });
    }

    const deviceToken = crypto.randomUUID();
    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    user = await prisma.anonymous_users.create({
      data: {
        device_token_hash: deviceTokenHash,
        email,
        auth_token_hash: authTokenHash,
        default_display_name: displayName || payload.name || 'Investigador',
      },
    });

    res.json({
      success: true, data: { userId: user.id, authToken, displayName: user.default_display_name, email: user.email },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao autenticar com Google.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Token não fornecido.' });

    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.anonymous_users.updateMany({ where: { auth_token_hash: tokenHash }, data: { auth_token_hash: null } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno ao fazer logout.' });
  }
};
