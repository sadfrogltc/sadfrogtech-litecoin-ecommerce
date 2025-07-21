"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function SubscriberTable({ subscribers }: { subscribers: { id: string, email: string, created_at: string }[] }) {
  const [list, setList] = useState(subscribers)
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this subscriber?")) return
    setLoading(id)
    const res = await fetch("/api/admin/delete-subscriber", {
      method: "POST",
      body: new URLSearchParams({ id }),
    })
    if (res.ok) {
      setList(list.filter(s => s.id !== id))
    }
    setLoading(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-muted">
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Subscribed</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-4 py-2 font-mono">{s.email}</td>
              <td className="px-4 py-2">{new Date(s.created_at).toISOString().replace('T', ' ').replace('Z', '')}</td>
              <td className="px-4 py-2 text-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={loading === s.id}
                  onClick={() => handleDelete(s.id)}
                >
                  {loading === s.id ? "Deleting..." : "Delete"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 