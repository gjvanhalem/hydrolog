import { NextResponse } from 'next/server';
import { getAuthenticatedUserWithSystems } from '@/lib/auth-with-systems';

export async function GET() {
  try {
    const user = await getAuthenticatedUserWithSystems();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}
