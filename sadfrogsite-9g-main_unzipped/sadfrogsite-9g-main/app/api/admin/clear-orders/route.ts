import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const db = neon(process.env.DATABASE_URL!)

// Simple admin check (replace with your real admin auth logic)
function isAdmin(req: NextRequest) {
  // Example: check for a header or session (replace with real logic)
  const adminSecret = req.headers.get('x-admin-secret')
  return adminSecret === process.env.ADMIN_SESSION_SECRET
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await db.query('DELETE FROM orders;')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 