import { Hono } from "npm:hono"
import { eq, and } from "npm:drizzle-orm" // Import 'and' for complex WHERE clauses
import { orm } from "../db/drizzle.ts"
import { tasks } from "../db/schema.ts"
import { saveDb } from "../db/connection.ts"
import { authMiddleware, CustomVariables } from "./auth.ts" // Assuming auth.ts is in the same directory

export const tasksRoute = new Hono<{ Variables: CustomVariables }>();

// Apply the middleware to ALL routes on the tasksRoute
// All routes below this line will require a valid JWT, 
// and the c.get("userId") will be available.
tasksRoute.use("/*", authMiddleware)

// =======================
// GET /api/tasks?q=keyword
// =======================
tasksRoute.get("/", async (c) => {
    // Retrieve the userId from the context (set by authMiddleware)
    const userId = c.get("userId")
    const q = (c.req.query("q") ?? "").toLowerCase()
    
    // Select ONLY tasks belonging to the current user
    let rows = await orm
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId)) // Scope by userId
        .all()
    
    // Apply search filter if query 'q' is present
    if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
    
    return c.json(rows)
})

// =======================
// POST /api/tasks
// =======================
tasksRoute.post("/", async (c) => {
    // Retrieve the userId from the context
    const userId = c.get("userId")
    const body = await c.req.json().catch(() => ({}))
    const title = String(body.title ?? "").trim()
    
    if (!title) return c.json({ error: "title required" }, 400)

    const priority = (body.priority ?? "medium") as string
    const status = (body.status ?? "todo") as string
    const module = (body.module ?? null) as string | null

    const inserted = await orm
        .insert(tasks)
        // Ensure the new task is associated with the current user
        .values({ title, priority, status, module, userId }) 
        .returning()
        .get()

    await saveDb()

    const headers = new Headers()
    headers.set("location", `/api/tasks/${inserted.id}`)
    return new Response(JSON.stringify(inserted), {
        status: 201,
        headers,
    })
})

// =======================
// PUT /api/tasks/:id
// =======================
tasksRoute.put("/:id", async (c) => {
    const userId = c.get("userId")
    const id = Number(c.req.param("id"))
    
    if (!Number.isFinite(id)) return c.json({ error: "invalid id" }, 400)

    const patch = await c.req.json().catch(() => ({}))
    // Destructure to prevent user from trying to change the ID or userId
    const { id: _ignoreId, userId: _ignoreUserId, ...safePatch } = patch 

    // Update operation: Must match BOTH task ID and userId to ensure ownership
    await orm.update(tasks)
        .set(safePatch)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .run()
        
    // Select the updated task to return to the client
    const updated = await orm.select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .get()
        
    await saveDb()

    if (!updated) {
        // Return 404 if not found OR 403 if they try to update another user's task
        return c.json({ error: "Task not found or unauthorized" }, 404) 
    }
    return c.json(updated)
})

// =======================
// DELETE /api/tasks/:id
// =======================
tasksRoute.delete("/:id", async (c) => {
    const userId = c.get("userId")
    const id = Number(c.req.param("id"))
    
    if (!Number.isFinite(id)) return c.json({ error: "invalid id" }, 400)

    // Delete operation: Must match BOTH task ID and userId
    const result = await orm.delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .run()
    
    const deleteResult = result as unknown as { changes: number };
    // In Drizzle SQLite, result.changes is the number of affected rows
    if (deleteResult.changes === 0) {
         // Same logic as PUT: not found or not owned
        return c.json({ error: "Task not found or unauthorized" }, 404) 
    }
    
    await saveDb()
    return c.json({ ok: true })
})