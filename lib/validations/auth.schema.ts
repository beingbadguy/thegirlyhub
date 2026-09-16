import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(120, "Email cannot exceed 120 characters."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password cannot exceed 128 characters."),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name cannot exceed 80 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(120, "Email cannot exceed 120 characters."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password cannot exceed 128 characters."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(120, "Email cannot exceed 120 characters."),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .trim()
    .min(6, "Invalid reset token format.")
    .max(128, "Invalid reset token format."),
  password: z
    .string()
    .min(6, "New password must be at least 6 characters.")
    .max(128, "Password cannot exceed 128 characters."),
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(120, "Email cannot exceed 120 characters."),
});

export const verificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(120, "Email cannot exceed 120 characters."),
});

export const verifyCodeSchema = z.object({
  token: z
    .string()
    .trim()
    .min(4, "Verification token must be at least 4 characters.")
    .max(64, "Verification token is too long."),
});

export const contactResponseSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid recipient email address.")
    .max(120, "Email cannot exceed 120 characters."),
  name: z
    .string()
    .trim()
    .min(1, "Recipient name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  response: z
    .string()
    .trim()
    .min(1, "Response message cannot be empty.")
    .max(5000, "Response message cannot exceed 5000 characters."),
});

export const userProfileUpdateSchema = z.object({
  address: z
    .string()
    .trim()
    .min(10, "Address must be at least 10 characters.")
    .max(300, "Address cannot exceed 300 characters."),
  phone: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Phone must be a valid 10-digit Indian mobile number.",
    }),
  city: z
    .string()
    .trim()
    .min(2, "City is required.")
    .max(80, "City cannot exceed 80 characters."),
  state: z
    .string()
    .trim()
    .min(2, "State is required.")
    .max(80, "State cannot exceed 80 characters."),
  zip: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^\d{6}$/.test(val), {
      message: "Pincode must be exactly 6 digits.",
    }),
  landmark: z
    .string()
    .trim()
    .max(150, "Landmark cannot exceed 150 characters.")
    .optional()
    .nullable(),
});

