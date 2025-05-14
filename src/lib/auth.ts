import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { logger } from './logger';

// JWT secret
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'your-secret-jwt-key-must-be-at-least-32-bytes-long-for-hs256';
if (JWT_SECRET_STRING === 'your-secret-jwt-key-must-be-at-least-32-bytes-long-for-hs256' && process.env.NODE_ENV === 'production') {
  logger.warn('Security Warning: Using default JWT_SECRET in production. Please set a strong, unique secret (at least 32 bytes) in your environment variables.');
}
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET_STRING);

const SESSION_EXPIRY_DAYS = 7;
const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_DAYS * 24 * 60 * 60;

export type AuthTokenPayload = jose.JWTPayload & {
  userId: number;
  sessionId: string;
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: number): Promise<string> {
  try {
    const now = new Date();
    await prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: { lt: now }
      }
    });

    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_SECONDS * 1000);
    
    const session = await prisma.session.create({
      data: {
        userId,
        expiresAt
      }
    });

    const token = await new jose.SignJWT({ userId, sessionId: session.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
      .sign(JWT_SECRET_BYTES);

    return token;
  } catch (error) {
    logger.error('Failed to create session', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      userId
    });
    throw new Error('Authentication failed: Could not create session.');
  }
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES) as { payload: AuthTokenPayload };
    
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId, userId: payload.userId }
    });
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      cookieStore.delete('auth_token');
      logger.warn('Session expired or invalid, cookie cleared', { sessionId: payload.sessionId, userId: payload.userId });
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        systemId: true // Include systemId in the user object
      }
    });
    
    return user;
  } catch (error) {
    if (error instanceof jose.errors.JOSEError) {
      logger.warn('JOSE Authentication error during getAuthenticatedUser', { 
        errorName: error.name, 
        errorMessage: error.message, 
        errorCode: error.code,
        tokenPresent: !!token
      });
    } else {
      logger.error('Generic authentication error during getAuthenticatedUser', { 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
      });
    }
    cookieStore.delete('auth_token');
    logger.warn('Auth token cookie cleared due to error in getAuthenticatedUser');
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (token) {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES) as { payload: AuthTokenPayload };
      await prisma.session.deleteMany({
        where: { id: payload.sessionId, userId: payload.userId }
      });
      logger.info('User session deleted successfully from DB', { sessionId: payload.sessionId, userId: payload.userId });
    } catch (error) {
      // Log error but proceed to delete cookie
      if (error instanceof jose.errors.JOSEError) {
        logger.warn('JOSE error during logout token verification', { errorName: error.name, errorMessage: error.message, errorCode: error.code });
      } else {
        logger.warn('Generic error during logout token verification', { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) });
      }
    }
  }
  cookieStore.delete('auth_token');
  logger.info('Auth token cookie cleared on logout');
}

export async function getCurrentUserId(): Promise<number | null> {
  const user = await getAuthenticatedUser();
  return user?.id || null;
}
