# ASTU Smart Complaint System

A comprehensive university complaint management system with role-based access and AI-powered assistance.

## Features

### 🎓 Student Portal
- **Registration & Login**: Secure student authentication
- **Complaint Filing**: Create complaints with file attachments (PDF, JPG, PNG)
- **Status Tracking**: Real-time complaint status updates
- **AI Assistant**: Groq-powered chatbot for guidance and FAQs
- **Department Selection**: Choose appropriate department for each complaint

### 👨‍💼 Staff Portal
- **Department Dashboard**: View complaints assigned to their department only
- **Status Management**: Update complaint status (Open → In Progress → Resolved)
- **Remarks System**: Add detailed notes and responses to complaints
- **File Access**: View and download student-submitted attachments

### 🔧 Admin Portal
- **Analytics Dashboard**: Comprehensive complaint statistics and resolution rates
- **Department Management**: Create and manage university departments
- **Staff Creation**: Add new staff members with department assignments
- **Global Overview**: View all complaints across all departments

## Technology Stack

### Frontend
- **React 19** with modern hooks and patterns
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **Supabase Client** for file storage

### Backend
- **Express.js** with ES modules
- **PostgreSQL** via Supabase
- **JWT Authentication** with role-based access control
- **Groq AI** for chatbot functionality
- **Bcrypt** for password hashing
- **Raw SQL queries** (no ORM for simplicity)

### Infrastructure
- **Supabase** for database and file storage
- **Environment-based configuration**
- **CORS-enabled API**

## Project Structure

```
complaint/
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # API client with JWT injection
│   │   ├── pages/                 # React pages by role
│   │   │   ├── student/           # Student-specific pages
│   │   │   ├── staff/             # Staff-specific pages
│   │   │   └── admin/             # Admin-specific pages
│   │   ├── supabaseClient.js      # Supabase client for file uploads
│   │   └── App.jsx                # Main router and layout
│   └── .env                       # Frontend environment variables
├── backend/
│   ├── src/
│   │   ├── routes/                # API routes by feature
│   │   ├── middleware/            # Auth and role middleware
│   │   ├── db.js                  # PostgreSQL connection
│   │   └── server.js              # Express app setup
│   └── .env                       # Backend environment variables
├── database-setup.sql             # Database initialization script
└── SETUP.md                       # Complete setup guide
```

## Security Features

- **JWT-based authentication** with expiration
- **Role-based access control** (student/staff/admin)
- **Password hashing** with bcrypt
- **SQL injection prevention** with parameterized queries
- **CORS protection** for API endpoints
- **Input validation** on all endpoints

## Database Schema

- **departments**: University departments
- **users**: Students, staff, and admin accounts
- **complaints**: Complaint records with status tracking
- **remarks**: Staff responses and updates

## Getting Started

See [SETUP.md](./SETUP.md) for detailed installation and configuration instructions.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login

### Student Routes
- `GET /api/student/complaints` - Get student's complaints
- `POST /api/student/complaints` - Create new complaint
- `GET /api/student/complaints/:id` - Get complaint details

### Staff Routes
- `GET /api/staff/complaints` - Get department complaints
- `PATCH /api/staff/complaints/:id/status` - Update complaint status
- `POST /api/staff/complaints/:id/remarks` - Add remark

### Admin Routes
- `GET /api/admin/analytics` - Get system analytics
- `POST /api/admin/departments` - Create department
- `POST /api/admin/staff` - Create staff account

### Chatbot
- `POST /api/chat/ask` - AI assistant queries

## License

This project is part of the ASTU Smart Complaint System initiative.
