import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Use a fixed filename
    const filename = 'current-level.json';
    const targetDir = path.join(process.cwd(), 'calculate', 'demo', 'src', 'main', 'java', 'calculate');
    const levelsDir = path.join(targetDir, 'levels');
    const filePath = path.join(levelsDir, filename);

    try {
      // Try to create directory, ignore if it exists
      await mkdir(levelsDir, { recursive: true });
    } catch (err) {
      // Ignore directory exists error
      if ((err as any).code !== 'EEXIST') {
        throw err;
      }
    }

    // Write level information to JSON file
    await writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Level information saved to ${filename}`);

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
