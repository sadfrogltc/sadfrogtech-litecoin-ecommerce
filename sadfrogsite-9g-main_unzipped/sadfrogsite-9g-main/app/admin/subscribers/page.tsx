import { sql } from '@/lib/neon';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SubscriberTable } from '@/components/admin/SubscriberTable';

export default async function SubscribersPage() {
  let subscribers: { id: string; email: string; created_at: string }[] = [];
  try {
    const rows = await sql`SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC`;
    subscribers = rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      created_at: row.created_at,
    }));
  } catch (e) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Subscribers</h2>
        <p className="text-red-600">Error loading subscribers list.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Total: {subscribers.length}</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </div>
          <SubscriberTable subscribers={subscribers} />
        </CardContent>
      </Card>
    </div>
  );
} 