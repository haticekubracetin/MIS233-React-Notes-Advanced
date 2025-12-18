import { Hono } from "npm:hono@4.10.4"
import { cors } from "npm:hono@4.10.4/cors"
import { tasksRoute } from './routes/tasks.ts';
import authRouter from "./routes/auth.ts"
import { logger } from "./middleware/logger.ts"
import { PORT } from "./config/env.ts"



const app = new Hono()

app.use(
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["content-type", "authorization"],
  })
)

app.use("*", logger)


app.route("/auth", authRouter);


app.route("/api/tasks", tasksRoute);

app.get("/api/hello", (c) =>
  c.json({ msg: "Hello from Hono + sql.js ✅" })
)

Deno.serve({ port: PORT }, app.fetch)

console.log(`Hono server running at http://localhost:${PORT}`)



