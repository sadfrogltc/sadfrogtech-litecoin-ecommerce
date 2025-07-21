"use client"

import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Database, Loader2, Skull } from "lucide-react"
import { resetDatabaseAction } from "@/app/admin/settings/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function DatabaseResetSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [state, formAction, isPending] = useActionState(resetDatabaseAction, { success: false, error: "" })
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    formAction(formData)
  }

  // Handle successful reset with useEffect to prevent infinite re-renders
  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      setIsDialogOpen(false)
      setPassword("")
      setConfirmation("")
      // Redirect to login since all sessions will be cleared
      setTimeout(() => {
        router.push("/admin/login")
      }, 2000)
    }
  }, [state.success, state.message, router])

  const isFormValid = password.length > 0 && confirmation === "RESET DATABASE"

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Skull className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>Irreversible actions that will permanently delete all data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Destructive Action</AlertTitle>
          <AlertDescription>
            The database reset will permanently delete ALL data including products, orders, customers, and admin
            sessions. This action cannot be undone and will require you to log in again.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium text-destructive">Reset Database</h4>
          <p className="text-sm text-muted-foreground">
            This will completely wipe all data from the database and reset the store to a fresh state.
          </p>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-2">
                <Database className="mr-2 h-4 w-4" />
                Reset Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm Database Reset
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="text-muted-foreground text-sm space-y-3">
                    <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                      <div className="font-semibold text-destructive text-sm">⚠️ THIS ACTION IS IRREVERSIBLE</div>
                      <div className="text-sm mt-1">All data will be permanently deleted:</div>
                      <ul className="text-xs mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        <li>All products and inventory</li>
                        <li>All customer orders and data</li>
                        <li>All admin sessions (you'll be logged out)</li>
                        <li>All audit logs and history</li>
                      </ul>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmation">
                    Type <code className="bg-muted px-1 rounded text-xs">RESET DATABASE</code> to confirm
                  </Label>
                  <Input
                    id="confirmation"
                    name="confirmation"
                    placeholder="RESET DATABASE"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>

                {state.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    type="submit"
                    disabled={!isFormValid || isPending}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Database...
                      </>
                    ) : (
                      <>
                        <Skull className="mr-2 h-4 w-4" />
                        Reset Database
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
