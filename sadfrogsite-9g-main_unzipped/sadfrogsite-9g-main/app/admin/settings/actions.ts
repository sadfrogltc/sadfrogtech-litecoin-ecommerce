"use server"

import { resetDatabase } from "@/lib/neon"
import { getAdminSession } from "@/lib/admin-session"
import { revalidatePath } from "next/cache"

export async function resetDatabaseAction(prevState: any, formData: FormData) {
  console.log("[Reset Database Action] === STARTING DATABASE RESET ACTION ===")

  // Verify admin session
  const session = await getAdminSession()
  if (!session) {
    console.error("[Reset Database Action] Unauthorized attempt - no valid session")
    return {
      success: false,
      error: "Authentication required. Please log in again.",
    }
  }

  console.log(`[Reset Database Action] Admin ${session.username} attempting database reset`)

  // Get and validate password
  const password = formData.get("password") as string
  const confirmation = formData.get("confirmation") as string

  if (!password) {
    console.log("[Reset Database Action] No password provided")
    return {
      success: false,
      error: "Password is required to reset the database.",
    }
  }

  if (confirmation !== "RESET DATABASE") {
    console.log("[Reset Database Action] Invalid confirmation text")
    return {
      success: false,
      error: "Please type 'RESET DATABASE' exactly to confirm.",
    }
  }

  // Verify admin password (same as login)
  if (password !== "sadfrogtech") {
    console.log("[Reset Database Action] Invalid password provided")
    return {
      success: false,
      error: "Invalid admin password.",
    }
  }

  try {
    console.log("[Reset Database Action] Password verified, proceeding with reset...")

    // Perform the database reset
    const result = await resetDatabase()

    console.log("[Reset Database Action] Database reset completed successfully")
    console.log(`[Reset Database Action] Admin ${session.username} successfully reset the database`)

    // Clear all caches
    revalidatePath("/admin", "layout")
    revalidatePath("/", "layout")

    return {
      success: true,
      message: "Database has been completely reset. All data has been permanently deleted.",
    }
  } catch (error) {
    console.error("[Reset Database Action] Database reset failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during database reset.",
    }
  }
}
