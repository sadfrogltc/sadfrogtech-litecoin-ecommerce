import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { sql } from '@/lib/neon';

export async function POST(req: NextRequest) {
  try {
    const { subject, message } = await req.json();
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }
    // Read all subscribers from the database
    let emails: string[] = [];
    try {
      const rows = await sql`SELECT email FROM subscribers`;
      emails = rows.map((row: any) => row.email).filter((e: string) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    } catch (e) {
      return NextResponse.json({ error: 'Could not read subscribers list.' }, { status: 500 });
    }
    if (emails.length === 0) {
      return NextResponse.json({ error: 'No subscribers found.' }, { status: 400 });
    }
    // Send email to each subscriber (sequentially for simplicity)
    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject,
          text: message,
          html: `<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>${message.replace(/\n/g, '<br/>')}</div>`
        });
        sent++;
      } catch (e) {
        failed++;
      }
    }
    return NextResponse.json({ success: true, sent, failed });
  } catch (e) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 