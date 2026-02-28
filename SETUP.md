# ASTU Smart Complaint System - Setup Guide

## Quick Setup Instructions

### 1. Database Setup
1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and run the entire contents of `database-setup.sql`
4. Note your database connection string from Settings > Database

### 2. Backend Setup
1. Navigate to `backend/`
2. Copy `../backend-env.example` to `.env` and update with your credentials:
   ```bash
   cp ../backend-env.example .env
   ```
3. Update `.env` with your actual values:
   - `DATABASE_URL`: Your Supabase connection string
   - `GROQ_API_KEY`: Get from https://groq.com
   - `JWT_SECRET`: Use a secure random string
4. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to `frontend/`
2. Update `.env` with your Supabase credentials:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_SUPABASE_BUCKET`: Default is `complaint-files`
3. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

### 4. Supabase Storage Setup
1. In Supabase, create a public bucket named `complaint-files`
2. Set up storage policies to allow authenticated users to upload files

### 5. Default Login
- Email: `admin@astu.edu`
- Password: `admin123`
⚠️ **Change this password immediately after first login!**

## Application URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Features
- **Students**: Register, file complaints, track status, AI assistant
- **Staff**: View department complaints, update status, add remarks
- **Admin**: Manage departments, create staff, view analytics

## Troubleshooting
- Ensure all `.env` files are properly configured
- Check that Supabase database setup SQL was executed completely
- Verify CORS settings in backend match frontend URL
- Make sure Supabase storage bucket exists with proper permissions
