import { z } from "zod"

const phoneRegex = new RegExp(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/)

export const checkoutSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  shippingAddress: z.object({
    street: z.string().min(3, { message: "Street address is required." }),
    city: z.string().min(2, { message: "City is required." }),
    state: z.string().min(2, { message: "State / Province is required." }),
    zip: z.string().min(3, { message: "ZIP / Postal code is required." }),
    country: z.string().min(2, { message: "Please select a country." }),
  }),
  phone: z.string().regex(phoneRegex, "Invalid phone number").or(z.literal("")).optional(),
  notes: z.string().max(500, { message: "Notes cannot exceed 500 characters." }).optional(),
})
