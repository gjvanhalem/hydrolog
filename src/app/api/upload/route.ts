import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(
  request: NextRequest,
  context: { params: {} }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await writeFile(join(uploadDir, file.name), buffer);
    } catch (err) {
      // If directory doesn't exist, create it and try again
      const { mkdir } = require('fs/promises');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, file.name), buffer);
    }
    
    return NextResponse.json({ 
      fileName: file.name,
      url: `/uploads/${file.name}` 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}
