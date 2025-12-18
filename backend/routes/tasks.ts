// backend/routes/tasks.ts
import { Hono } from "npm:hono@4.10.4";
import { sqlDb, saveDb } from "../db/connection.ts";
import { authMiddleware } from "./auth.ts"; // Ensure this import is correct

// 1. Setup the route with Type Safety for userId
export const tasksRoute = new Hono<{ Variables: { userId: number } }>();

// 2. ACTIVATE THE SECURITY GUARD
// This is the most important line. It must be ABOVE the routes.
tasksRoute.use("*", authMiddleware);

// 3. LIST TASKS (GET)
tasksRoute.get("/", async (c) => {
  try {
    const userId = c.get("userId"); // Now dynamic
    console.log(`🔍 Checking tasks for user: ${userId}`);

    const stmt = sqlDb.prepare("SELECT * FROM tasks WHERE userId = ? ORDER BY id DESC");
    stmt.bind([userId]);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return c.json(results);
  } catch (err: any) {
    console.error("❌ GET Error:", err.message);
    return c.json({ error: err.message }, 500);
  }
});

// 4. CREATE TASK (POST)
tasksRoute.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { title, priority, status } = body;
    const userId = c.get("userId"); // Now dynamic

    console.log(`📝 Saving task: "${title}" for user: ${userId}`);

    sqlDb.run(
      "INSERT INTO tasks (title, userId, status, priority, module) VALUES (?, ?, ?, ?, ?)",
      [title, userId, status || "todo", priority || "medium", null]
    );

    await saveDb(); 
    return c.json({ success: true, message: "Task saved" }, 201);
  } catch (err: any) {
    console.error("❌ POST Error:", err.message);
    return c.json({ error: err.message }, 500);
  }
});

// 5. DELETE TASK (DELETE)
tasksRoute.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId"); // Now dynamic

    // Security: Only delete if the ID matches AND it belongs to this user
    sqlDb.run("DELETE FROM tasks WHERE id = ? AND userId = ?", [id, userId]);

    await saveDb();
    return c.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE Error:", err.message);
    return c.json({ error: err.message }, 500);
  }
});