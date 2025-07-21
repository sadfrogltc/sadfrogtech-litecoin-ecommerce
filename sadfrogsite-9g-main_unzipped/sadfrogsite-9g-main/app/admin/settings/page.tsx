import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Shield, Database, Mail } from "lucide-react"
import Link from "next/link"
import { DatabaseResetSection } from "@/components/admin/database-reset-section"
import { SystemStatusSection } from "@/components/admin/system-status-section"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Configure your store settings and preferences</p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              General Settings
            </CardTitle>
            <CardDescription className="text-sm">Basic store configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Store Name</label>
                <p className="text-xs sm:text-sm text-muted-foreground">SadFrogTech</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Currency</label>
                <p className="text-xs sm:text-sm text-muted-foreground">USD (with LTC payments)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <SystemStatusSection />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Security Settings
            </CardTitle>
            <CardDescription className="text-sm">Admin access and security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Session Timeout</label>
                <p className="text-xs sm:text-sm text-muted-foreground">2 hours of inactivity</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Max Session Duration</label>
                <p className="text-xs sm:text-sm text-muted-foreground">24 hours</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Admin Username</label>
                <p className="text-xs sm:text-sm text-muted-foreground">sadfrog</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
              Database Settings
            </CardTitle>
            <CardDescription className="text-sm">Database configuration and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Database Provider</label>
                <p className="text-xs sm:text-sm text-muted-foreground">Neon PostgreSQL</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Connection Status</label>
                <p className="text-xs sm:text-sm text-green-600">Connected</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Auto-backup</label>
                <p className="text-xs sm:text-sm text-muted-foreground">Managed by Neon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              Email Settings
            </CardTitle>
            <CardDescription className="text-sm">Email notifications and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium">Email Provider</label>
                <p className="text-xs sm:text-sm text-green-600">Resend (Configured)</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Order Confirmations</label>
                <p className="text-xs sm:text-sm text-green-600">Enabled</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Payment Receipts</label>
                <p className="text-xs sm:text-sm text-green-600">Enabled</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Status Updates</label>
                <p className="text-xs sm:text-sm text-green-600">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <DatabaseResetSection />
    </div>
  )
}
