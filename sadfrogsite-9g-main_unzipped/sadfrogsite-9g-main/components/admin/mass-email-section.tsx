"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Send } from "lucide-react"

export function MassEmailSection() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/send-mass-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess("Promotion email sent to all subscribers!")
        setSubject("")
        setMessage("")
      } else {
        setError(data.error || "Failed to send emails.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to send emails.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>
          <Send className="inline-block mr-2 text-primary" />
          Send Promotion Email to Subscribers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <Input
            type="text"
            placeholder="Email Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            maxLength={120}
          />
          <Textarea
            placeholder="Your promotional message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            required
            maxLength={2000}
          />
          <Button type="submit" disabled={loading || !subject || !message}>
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </form>
        {success && (
          <Alert className="mt-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 