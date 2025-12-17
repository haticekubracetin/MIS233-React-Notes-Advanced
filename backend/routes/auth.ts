import { Hono, Context, Next } from "npm:hono@4.10.4"
import bcrypt from "npm:bcrypt"
import { eq } from "npm:drizzle-orm"
// Import all necessary functions for JWT handling
import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v2.9/mod.ts"

import { orm } from "../db/drizzle.ts"
import { users } from "../db/schema.ts"

export interface CustomVariables {
  userId: number;
}


// --- Configuration ---
const auth = new Hono()
const JWT_SECRET = "dev-secret" // IMPORTANT: Move this to an environment variable in a real application!

// Convert string secret to CryptoKey for JWT operations
async function getKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

// ===================================
// EXPORTED AUTHENTICATION MIDDLEWARE
// ===================================
// Used by tasks.ts to protect routes and extract the user's ID
export async function authMiddleware(c: Context<{ Variables: CustomVariables }>, next: Next) {
  const authHeader = c.req.header("Authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token format" }, 401)
  }

  const token = authHeader.replace("Bearer ", "")
  const key = await getKey()

  try {
    const payload = await verify(token, key)
    
    // FIX: Safely assert/cast the payload.userId to number.
    // We expect the 'userId' stored in the JWT to be a number.
    const userId = Number(payload.userId); 

    if (isNaN(userId)) {
      // If the token payload is somehow corrupted, reject it.
      return c.json({ error: "Unauthorized: Invalid user ID in token" }, 401)
    }

    // Attach the verified user ID to the Hono context (now correctly typed as number)
    c.set("userId", userId) 
    
    await next() // Proceed to the route handler
  } catch (e) {
    // Token is invalid (expired, wrong signature, etc.)
    console.error("JWT Verification failed:", e)
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401)
  }
}

// =======================
// REGISTER (Bonus Item)
// =======================
auth.post("/register", async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: "Missing fields" }, 400)

  // 1. Check if user already exists
  const existing = await orm.select().from(users).where(eq(users.username, username))
  if (existing.length > 0) return c.json({ error: "User already exists" }, 409)

  // 2. Hash and save the user
  const hashedPassword = await bcrypt.hash(password, 10)
  await orm.insert(users).values({ username, password: hashedPassword })

  return c.json({ message: "User registered successfully" })
})

// =======================
// LOGIN
// =======================
auth.post("/login", async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: "Missing fields" }, 400)

  // 1. Find the user
  const result = await orm.select().from(users).where(eq(users.username, username))
  if (result.length === 0) return c.json({ error: "Invalid credentials" }, 401)

  const user = result[0]
  
  // 2. Verify the hashed password
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return c.json({ error: "Invalid credentials" }, 401)

  // 3. Issue the JWT
  const key = await getKey() 
  const payload = {
    userId: user.id,
    // Token expires in 1 hour (60 * 60 seconds)
    exp: getNumericDate(60 * 60), 
  }

  const token = await create({ alg: "HS256", typ: "JWT" }, payload, key)

  // 4. Return token and user ID
  return c.json({ message: "ok", token, userId: user.id })
})

// Export the Hono router for use in your main server file
export default auth





