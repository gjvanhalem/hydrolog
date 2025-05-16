import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth-with-systems';
import { logger } from '@/lib/logger';
import { authRateLimiter } from '@/lib/auth-rate-limiter';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, systemName, rows, positionsPerRow } = await req.json();

    if (!email || !password || !systemName || !rows || !Array.isArray(positionsPerRow)) {
      return NextResponse.json(
        { error: 'Email, password, and system details are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Ensure positionsPerRow contains numbers, not strings
    const numericPositionsPerRow = Array.isArray(positionsPerRow) 
      ? positionsPerRow.map(pos => typeof pos === 'string' ? parseInt(pos, 10) : pos) 
      : positionsPerRow;    // Hash password and create user with system
    const hashedPassword = await hashPassword(password);

    // Create the user first
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      }
    });
    
    // Create the system
    const newSystem = await prisma.system.create({
      data: {
        name: systemName,
        rows,
        positionsPerRow: numericPositionsPerRow as Prisma.InputJsonValue, // Explicitly cast to Prisma.InputJsonValue
      }
    });
    
    // Create the user-system relationship with isActive=true
    await prisma.userSystem.create({
      data: {
        userId: newUser.id,
        systemId: newSystem.id,
        isActive: true
      }
    });
      // Get the user with systems included
    const userWithSystems = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        systems: {
          include: { system: true }
        }
      }
    });    logger.info('User registered successfully', { userId: newUser.id, email });

    // Create session and generate token
    const token = await createSession(newUser.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'strict'
    });    // Ensure we have a user with systems
    if (!userWithSystems) {
      logger.error('User created but could not retrieve with systems', { userId: newUser.id });
      return NextResponse.json(
        { error: 'User created but error occurred retrieving user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userWithSystems
    });
  } catch (error) {
    logger.error('Signup error', { error });
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
