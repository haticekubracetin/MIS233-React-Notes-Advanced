🚀 Multi-User Task Management System
A full-stack, secure task management application featuring JWT Authentication, a RESTful API, and a dynamic React frontend.

🌟 Key Features
Secure Authentication: User registration and login using JWT (JSON Web Tokens) and Bcrypt password hashing.

Multi-User Architecture: Tasks are isolated per user; each user can only access, create, and delete their own data.

Dynamic CRUD: Full Create, Read, Update, and Delete functionality for tasks.

State-of-the-Art Backend: Built with Hono on Deno, utilizing a high-performance sql.js (SQLite) database.

Responsive Frontend: Modern UI built with React and custom CSS-in-JS for a clean, professional look.

🏗️ Technical Stack
Frontend: React, React Router, Custom Hooks (useAuthFetch).

Backend: Hono Framework, Deno Runtime.

Database: SQLite via sql.js (with physical file persistence).

Security: Middleware-based route protection, JWT-based session management.

🛠️ Installation & Setup
Clone the repository:

Bash
git clone <your-repo-link>
cd <folder-name>
Start the Backend: Navigate to the backend folder and run:

Bash
deno run --allow-all main.ts
The server will start at http://localhost:8000. The SQLite database file will be automatically generated on the first run.

Start the Frontend: Navigate to the frontend folder and run:

Bash
npm install
npm run dev
🔒 Security Implementation
This project follows industry best practices for security:

Auth Middleware: Every API request to /api/tasks is intercepted by a middleware that verifies the JWT token in the Authorization header.

Database Isolation: All SQL queries are parameterized (using ? placeholders) to prevent SQL Injection attacks and use the userId from the verified token to ensure data privacy.
