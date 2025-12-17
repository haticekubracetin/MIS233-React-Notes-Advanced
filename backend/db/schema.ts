import { sqliteTable, integer, text } from "npm:drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
})

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  status: text("status").default("todo"),
  priority: text("priority").default("medium"),
  module: text("module"),
  userId: integer("user_id").notNull(), // associate task with user
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
})



