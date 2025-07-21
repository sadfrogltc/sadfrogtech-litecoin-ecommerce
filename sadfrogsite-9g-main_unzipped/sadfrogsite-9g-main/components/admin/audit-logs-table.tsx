"use client"

import * as React from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { AuditLog } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString()
}

function ActionBadge({ action }: { action: string }) {
  let variant: "default" | "destructive" | "secondary" = "secondary"
  if (action.includes("success")) {
    variant = "default"
  } else if (action.includes("failed")) {
    variant = "destructive"
  }
  return <Badge variant={variant}>{action.replace(/_/g, " ").toLowerCase()}</Badge>
}

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const [filter, setFilter] = React.useState("")

  const filteredLogs = logs.filter(
    (log) =>
      log.username.toLowerCase().includes(filter.toLowerCase()) ||
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.target_id.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter logs by user, action, or target ID..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.created_at)}</TableCell>
                  <TableCell>{log.username}</TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.target_type}</span>
                      <span className="text-xs text-muted-foreground">{log.target_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Log Details</DialogTitle>
                            <DialogDescription>Raw JSON details for this audit event.</DialogDescription>
                          </DialogHeader>
                          <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                            <code className="text-white">{JSON.stringify(log.details, null, 2)}</code>
                          </pre>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
