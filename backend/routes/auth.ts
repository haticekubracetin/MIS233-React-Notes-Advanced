// backend/routes/auth.ts
import { Hono, Context, Next } from "npm:hono@4.10.4"
import bcrypt from "npm:bcrypt"
import { eq } from "npm:drizzle-orm"
import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v2.9/mod.ts"

import { orm } from "../db/drizzle.ts"
import { users } from "../db/schema.ts"

// Define the shape of our context variables for type safety across the app
export interface CustomVariables {
  userId: number;
}

const auth = new Hono<{ Variables: CustomVariables }>()
const JWT_SECRET = "dev-secret" // IMPORTANT: Use environment variables in production

/**
 * Generates a CryptoKey for JWT signing and verification.
 */
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
/**
 * CRITICAL FIX: Added 'export' so tasks.ts can use this function.
 * Verifies the JWT and attaches the userId to the request context.
 */
export async function authMiddleware(c: Context<{ Variables: CustomVariables }>, next: Next) {
  const authHeader = c.req.header("Authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token format" }, 401)
  }

  const token = authHeader.replace("Bearer ", "")
  const key = await getKey()

  try {
    const payload = await verify(token, key)
    const userId = Number(payload.userId); 

    if (isNaN(userId)) {
      return c.json({ error: "Unauthorized: Invalid user identifier in token" }, 401)
    }

    // Set the userId in the context so TasksRoute can access it
    c.set("userId", userId) 
    await next() 
  } catch (e) {
    console.error("JWT Verification failed:", e)
    return c.json({ error: "Unauthorized: Session expired or invalid" }, 401)
  }
}

// =======================
// REGISTER ROUTE
// =======================
auth.post("/register", async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) {
      return c.json({ error: "Please provide both username and password" }, 400)
    }

    // Check if user already exists
    const existing = await orm.select().from(users).where(eq(users.username, username))
    if (existing.length > 0) {
      return c.json({ error: "This username is already taken" }, 409)
    }

    // Hash password and insert user
    const hashedPassword = await bcrypt.hash(password, 10)
    const [newUser] = await orm.insert(users).values({ 
      username, 
      password: hashedPassword 
    }).returning({ id: users.id });

    return c.json({ 
      message: "Registration successful", 
      success: true,
      userId: newUser.id 
    }, 201)
  } catch (err: any) {
    console.error("Registration error:", err)
    return c.json({ error: "Internal server error during registration" }, 500)
  }
})

// =======================
// LOGIN ROUTE
// =======================
auth.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400)
    }

    // Verify user exists
    const result = await orm.select().from(users).where(eq(users.username, username))
    if (result.length === 0) {
      return c.json({ error: "User not found" }, 401)
    }

    const user = result[0]
    
    // Check password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return c.json({ error: "Incorrect password" }, 401)
    }

    // Create JWT (Valid for 24 hours)
    const key = await getKey() 
    const payload = {
      userId: user.id,
      exp: getNumericDate(60 * 60 * 24), 
    }

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key)

    return c.json({ 
      message: "Login successful", 
      token, 
      userId: user.id 
    })
  } catch (err: any) {
    console.error("Login error:", err)
    return c.json({ error: "Internal server error during login" }, 500)
  }
})

export default auth





