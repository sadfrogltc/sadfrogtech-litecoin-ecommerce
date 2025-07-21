"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ClearOrdersButton() {
  async function handleClearOrders() {
    if (!window.confirm("Are you sure you want to delete ALL orders? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/clear-orders", {
        method: "POST",
        headers: {
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "sadfrogtech-admin-secret-2024"
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("All orders deleted.");
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to delete orders.");
      }
    } catch (e) {
      toast.error("Error deleting orders: " + (e?.message || e));
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClearOrders}>
      Clear All Orders
    </Button>
  );
} 