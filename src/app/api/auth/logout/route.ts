import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logout } from '@/lib/auth';

export async function POST() {
  try {
    // Clear the session
    await logout();
    
    // Log the session clearance
    logger.info('User session cleared from DB and cookie deleted');

    // Clear the cookie by setting it with an immediate expiration
    const cookieStore = await cookies(); // Ensure await is used
    cookieStore.set({
      name: 'auth_token',
      value: '', 
      httpOnly: true,
      path: '/',
      expires: new Date(0),
      maxAge: 0
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
