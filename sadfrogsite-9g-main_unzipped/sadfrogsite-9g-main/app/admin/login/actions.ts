"use server"

import { createSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export async function login(prevState: any, formData: FormData) {
  console.log("[Login Action] Processing login attempt")

  try {
    // Validate input
    const validatedFields = loginSchema.safeParse({
      username: formData.get("username"),
      password: formData.get("password"),
    })

    if (!validatedFields.success) {
      console.log("[Login Action] Validation failed:", validatedFields.error.flatten().fieldErrors)
      return {
        error: "Please provide both username and password.",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { username, password } = validatedFields.data

    console.log(`[Login Action] Attempting authentication for user: ${username}`)

    // Authenticate user (in production, this would check against a database)
    // Remove or comment out the following test login:
    // if (username === "sadfrog" && password === "sadfrogtech") {
    //   console.log("[Login Action] Authentication successful")

    //   // Create secure session
    //   await createSession("admin-001", username)
    //   console.log("[Login Action] Session created successfully")

    //   // Get redirect URL from query params or default to admin dashboard
    //   const redirectTo = "/admin"
    //   console.log(`[Login Action] Redirecting to: ${redirectTo}`)
    // } else {
      console.log("[Login Action] Authentication failed - invalid credentials")
      return {
        error: "Invalid username or password. Please try again.",
      }
    // }
  } catch (error) {
    console.error("[Login Action] Unexpected error during login:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }

  // Redirect after successful login (this must be outside the try-catch)
  redirect("/admin")
}
