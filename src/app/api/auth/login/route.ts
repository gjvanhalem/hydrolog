import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth-with-systems';
import { logger } from '@/lib/logger';
import { authRateLimiter } from '@/lib/auth-rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Check rate limiting
    const rateLimitResponse = await authRateLimiter(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    const { email, password } = await req.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
      // Find the user with their systems
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        systems: {
          include: {
            system: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Failed login attempt', { email });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session and generate token
    const token = await createSession(user.id);
    
    logger.info('User logged in successfully', { userId: user.id, email });
    
    // Set cookie
    const cookieStore = await cookies(); // Added await
    cookieStore.set({ // Now using the resolved cookieStore
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'strict'
    });    // Get the user's systems
    const userSystems = await prisma.userSystem.findMany({
      where: { userId: user.id },
      include: { system: true }
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systems: userSystems
      }
    });
  } catch (error) {
    logger.error('Login error', { error });
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
