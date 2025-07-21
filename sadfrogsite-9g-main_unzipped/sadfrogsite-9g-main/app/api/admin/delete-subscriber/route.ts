import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = formData.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing subscriber id.' }, { status: 400 });
    }
    await sql`DELETE FROM subscribers WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 