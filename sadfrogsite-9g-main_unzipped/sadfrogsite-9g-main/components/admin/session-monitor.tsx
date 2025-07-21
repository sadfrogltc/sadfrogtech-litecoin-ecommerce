"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Users, Clock, AlertCircle } from "lucide-react"

interface SessionInfo {
  sessionId: string
  username: string
  loginTime: string
  lastActivity: string
  ipAddress: string
  userAgent: string
}

export function SessionMonitor() {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSessions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("[Session Monitor] Fetching sessions...")
      const response = await fetch("/api/admin/sessions")

      console.log(`[Session Monitor] Response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[Session Monitor] Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()
      console.log("[Session Monitor] Response data:", data)

      if (data.success) {
        setSessions(data.sessions || [])
        setLastUpdated(new Date())
        console.log(`[Session Monitor] Loaded ${data.count} active sessions`)
      } else {
        throw new Error(data.error || "Failed to fetch sessions")
      }
    } catch (error) {
      console.error("[Session Monitor] Error fetching sessions:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString()
    } catch {
      return "Invalid date"
    }
  }

  const getTimeSince = (timeString: string) => {
    try {
      const time = new Date(timeString)
      const now = new Date()
      const diffMs = now.getTime() - time.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return "Unknown"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              {sessions.length} active admin session{sessions.length !== 1 ? "s" : ""}
              {lastUpdated && <span className="ml-2 text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</span>}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading sessions: {error}</AlertDescription>
          </Alert>
        )}

        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.sessionId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{session.username}</div>
                  <div className="text-sm text-muted-foreground">Session: {session.sessionId.substring(0, 12)}...</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Login: {formatTime(session.loginTime)}
                    </div>
                    <div className="mt-1">Last activity: {getTimeSince(session.lastActivity)}</div>
                  </div>
                  <div>
                    <div>IP: {session.ipAddress}</div>
                    <div className="mt-1 truncate" title={session.userAgent}>
                      {session.userAgent}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !error && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">No active sessions found</div>
        ) : isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
