import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    // Run curl command to POST to /api/subscribe
    const curlCmd = `curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"${email}"}'`;
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(curlCmd, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
    if (result.stderr) {
      return NextResponse.json({ error: result.stderr }, { status: 500 });
    }
    return NextResponse.json({ success: true, output: result.stdout });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 