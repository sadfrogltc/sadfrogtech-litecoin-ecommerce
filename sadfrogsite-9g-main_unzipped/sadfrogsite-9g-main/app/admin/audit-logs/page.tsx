import { getAuditLogs } from "@/lib/data"
import { AuditLogsTable } from "@/components/admin/audit-logs-table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default async function AuditLogsPage() {
  const logs = await getAuditLogs()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>A log of recent administrative actions performed in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
