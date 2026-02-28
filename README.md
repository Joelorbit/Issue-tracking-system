## ASTU Smart Complaint System (Easy Version)

A small full‑stack app for managing university complaints with three roles:

- **Student**: register, login, create complaints with a single attachment, track status, read staff remarks, use an AI helper.
- **Department staff**: login, see complaints for *their* department only, update status, add remarks.
- **Admin**: login, manage departments, create staff, see all complaints, and a simple analytics dashboard.

Frontend is **React + Tailwind**, backend is **Express + PostgreSQL (Supabase)** with **JWT auth** and **Supabase Storage** for file uploads. No ORM, just raw SQL.

---

### 1. Folder structure

- `frontend/` – Vite React app (Tailwind, React Router, minimal pages)
  - `src/App.jsx` – main router + layout + role‑based navigation
  - `src/api/client.js` – small `fetch` wrapper that injects JWT
  - `src/pages/...` – pages for public, student, staff, admin flows
  - `src/supabaseClient.js` – Supabase client used only for file uploads
- `backend/` – Express API (simple structure, no ORM)
  - `src/server.js` – Express app entry
  - `src/db.js` – PostgreSQL connection helper (using `pg`)
  - `src/middleware/auth.js` – JWT + role middleware
  - `src/routes/*.js` – routes per area: `auth`, `student`, `staff`, `admin`, `chatbot`
- `backend-env.example` – example backend `.env` file

You can keep this layout or move `backend/` to the project root; just update paths and `README` accordingly.

---

### 2. Database (Supabase PostgreSQL)

Create a new Supabase project and run this SQL in the SQL editor.

```sql
-- 1. departments
CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE
);

-- 2. users
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password      text NOT NULL,
  role          text NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  department_id uuid REFERENCES departments(id)
);

-- 3. complaints
CREATE TABLE complaints (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text NOT NULL,
  status        text NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  file_url      text,
  student_id    uuid NOT NULL REFERENCES users(id),
  department_id uuid NOT NULL REFERENCES departments(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 4. remarks
CREATE TABLE remarks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  staff_id     uuid NOT NULL REFERENCES users(id),
  message      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

**Initial admin**

You can manually insert an admin row from Supabase:

```sql
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@example.com',
  '$2a$10$changemehashed', -- replace with a bcrypt hash you generate locally
  'admin'
);
```

Or temporarily add a small script/route to create a first admin, then remove it.

---

### 3. Supabase Storage (single file per complaint)

1. In Supabase, create a **public bucket**, e.g. `complaint-files`.
2. In *Policies* for that bucket, allow uploads for your client (or keep it open during development).
3. Copy your **project URL** and **anon public key**.

Frontend uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_BUCKET` (defaults to `complaint-files` if omitted)

Student complaint creation:

- File is uploaded directly from frontend to Supabase Storage using the anon key.
- Public URL is generated and sent with the complaint to the backend.
- Backend stores only `file_url` in the `complaints` table.
- Staff can view/download the file via the stored URL.

Allowed types in the UI: `jpg`, `png`, `pdf`.

---

### 4. Backend configuration (Express + Supabase Postgres)

Copy `backend-env.example` to `.env` inside the backend folder (`backend/.env`):

```bash
PORT=4000
NODE_ENV=development

DATABASE_URL=postgres://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=complaint-files

JWT_SECRET=supersecretjwtkey
JWT_EXPIRES_IN=7d

GROQ_API_KEY=gsk-...
```

> **Note**: The current code only uses `DATABASE_URL`, `JWT_*`, and `GROQ_API_KEY`. `SUPABASE_*` are there if you later decide to move uploads from the frontend into the backend.

**Install backend dependencies** (run from `backend/` folder):

```bash
npm install express cors jsonwebtoken bcryptjs dotenv pg
```

**Run backend**:

```bash
cd backend
npm run dev
```

The API will default to `http://localhost:4000`.

---

### 5. Frontend configuration (React + Tailwind + Supabase client)

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_SUPABASE_BUCKET=complaint-files
```

Install frontend dependencies (from `frontend/`):

```bash
npm install
npm install react-router-dom @supabase/supabase-js
```

Run frontend:

```bash
cd frontend
npm run dev
```

Default Vite URL: `http://localhost:5173`

---

### 6. Role‑based API overview

**Authentication (`/api/auth`)**

- `POST /api/auth/register` – student self‑registration
  - Body: `{ name, email, password }`
  - Creates `users.role = 'student'`
  - Returns `{ token, user }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns `{ token, user }` (for student, staff, or admin)

Tokens are JWTs signed with `JWT_SECRET`. The payload contains:

- `id`, `name`, `role` (`student | staff | admin`), `department_id` (for staff).

**Student routes (`/api/student`, role: `student`)**

- `GET /api/student/complaints`
  - Returns only complaints where `student_id = current_user.id`.
- `POST /api/student/complaints`
  - Body: `{ title, description, department_id, file_url }`
  - Creates complaint with status `Open`.
- `GET /api/student/complaints/:id`
  - Returns the complaint (if it belongs to the student) plus all remarks.

**Staff routes (`/api/staff`, role: `staff`)**

- `GET /api/staff/complaints`
  - Complaints where `department_id = current_staff.department_id`.
- `GET /api/staff/complaints/:id`
  - Single complaint + remarks, constrained to staff’s department.
- `PATCH /api/staff/complaints/:id/status`
  - Body: `{ status }` where status is one of: `Open`, `In Progress`, `Resolved`.
  - Enforces transitions:
    - `Open → In Progress`
    - `In Progress → Resolved`
- `POST /api/staff/complaints/:id/remarks`
  - Body: `{ message }`
  - Adds a remark linked to the staff user.

**Admin routes (`/api/admin`, role: `admin`)**

- `POST /api/admin/departments` – create a department.
- `GET /api/admin/departments` – list departments and counts.
- `POST /api/admin/staff` – create staff user assigned to one department.
- `GET /api/admin/complaints` – list all complaints with joins.
- `GET /api/admin/analytics` – returns:
  - `total_complaints`
  - `total_resolved`
  - `total_open`
  - `complaints_per_department` (name + count)
  - `resolution_rate` (%)

**Chatbot (`/api/chat`)**

- `POST /api/chat/ask`
  - Body: `{ question }`
  - Calls Groq (`llama-3.1-8b-instant`), returns `{ answer }`.
  - No memory, no conversation storage.

All role checks are enforced via backend middleware (`authRequired` + `requireRole`).

---

### 7. Frontend pages and flows

**Public**

- `Login` – calls `/api/auth/login`.
- `Register` – calls `/api/auth/register` (students only).
- Successful auth stores:
  - `astu_token` – JWT
  - `astu_user` – user JSON

**Student**

- `Dashboard` – lists own complaints with status chips.
- `Create complaint` – form with:
  - Title, description, department
  - Single file (jpg/png/pdf) → uploaded to Supabase Storage
  - Backend receives `file_url`.
- `AI Chat` – textarea + one reply box, sends to `/api/chat/ask`.

**Staff**

- `Dashboard` – department complaints only.
- `Complaint detail`:
  - Shows full complaint, status, student, attachment link.
  - Buttons:
    - `Mark In Progress` / `Mark Resolved` (respecting allowed transitions).
  - Simple remarks feed + "add remark" box.

**Admin**

- `Analytics` – simple cards + bar‑style list (no heavy chart library).
- `Manage departments` – create + list departments with complaint counts.
- `Create staff` – form for name/email/password + department.

Routing is handled in `App.jsx` using React Router with a small `ProtectedRoute` wrapper.

---

### 8. What is intentionally NOT included

Per your constraints, the project does **not** include:

- Real‑time sockets or live updates
- Email notifications
- Complex filters or advanced search
- Multi‑file upload
- Heavy charts or BI dashboards
- Microservices or complex architecture
- ORM (all DB access is via `pg` and raw SQL)

The goal is to keep everything **small, clean, and easy to reason about** while still covering all of the required behaviour.

