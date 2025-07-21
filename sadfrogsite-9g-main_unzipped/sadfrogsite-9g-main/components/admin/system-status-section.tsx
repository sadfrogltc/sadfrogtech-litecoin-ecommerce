"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Wifi, WifiOff, AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ApiStatus = {
  name: string
  status: "Operational" | "Degraded" | "Offline"
  statusCode: number | null
  error?: string
}

type EnvCheck = {
  name: string
  set: boolean
}

type SystemStatus = {
  paymentProviderStatuses: ApiStatus[]
  explorerApiStatuses: ApiStatus[]
  envChecks: EnvCheck[]
}

const StatusIndicator = ({ status }: { status: ApiStatus["status"] }) => {
  if (status === "Operational") {
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }
  if (status === "Degraded") {
    return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }
  return <XCircle className="h-5 w-5 text-red-500" />
}

const EnvIndicator = ({ set }: { set: boolean }) => {
  if (set) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-500">
        Set
      </Badge>
    )
  }
  return <Badge variant="destructive">Not Set</Badge>
}

export function SystemStatusSection() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/system-status")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const systemStatus = await response.json()
      setStatus(systemStatus)
    } catch (err: any) {
      console.error("Failed to fetch system status:", err)
      setError(err.message || "An unknown error occurred.")
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const ApiStatusList = ({ title, statuses }: { title: string; statuses?: ApiStatus[] }) => (
    <div>
      <h4 className="font-medium mb-2 text-sm">{title}</h4>
      <div className="space-y-2 rounded-md border p-4 min-h-[120px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Checking statuses...</span>
          </div>
        ) : statuses ? (
          statuses.map((api) => (
            <div key={api.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {api.status === "Operational" ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium">{api.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{api.status}</span>
                <StatusIndicator status={api.status} />
              </div>
            </div>
          ))
        ) : (
          !error && <p className="text-sm text-destructive">Could not load statuses.</p>
        )}
      </div>
    </div>
  )

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System & API Status
            </CardTitle>
            <CardDescription>Live status of external services and environment configuration.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchStatus} disabled={isLoading}>
            <span className="sr-only">Refresh Status</span>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <ApiStatusList title="Payment Provider API" statuses={status?.paymentProviderStatuses} />
          <ApiStatusList title="Explorer APIs" statuses={status?.explorerApiStatuses} />
        </div>

        <div>
          <h4 className="font-medium mb-2 text-sm">Environment Configuration</h4>
          <div className="space-y-2 rounded-md border p-4 min-h-[120px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Checking environment...</span>
              </div>
            ) : status?.envChecks ? (
              status.envChecks.map((env) => (
                <div key={env.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{env.name}</span>
                  <EnvIndicator set={env.set} />
                </div>
              ))
            ) : (
              !error && <p className="text-sm text-destructive">Could not load environment status.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
