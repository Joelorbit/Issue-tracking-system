import express from 'express';
import { query } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

export const adminRouter = express.Router();

adminRouter.use(authRequired, requireRole('admin'));

adminRouter.post('/departments', async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const result = await query(
      `INSERT INTO departments (name) VALUES ($1) RETURNING *`,
      [name],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/departments', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, COUNT(c.id) AS complaint_count
       FROM departments d
       LEFT JOIN complaints c ON c.department_id = d.id
       GROUP BY d.id
       ORDER BY d.name`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/staff', async (req, res, next) => {
  try {
    const { name, email, password, department_id } = req.body;
    const cleanedName = name?.trim();
    const cleanedEmail = email?.trim().toLowerCase();
    const cleanedPassword = password?.trim();
    if (!cleanedName || !cleanedEmail || !cleanedPassword || !department_id) {
      return res.status(400).json({
        message: 'Name, email, password, and department are required',
      });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [
      cleanedEmail,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'Email already used' });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const hashed = await bcrypt.hash(cleanedPassword, 10);

    const result = await query(
      `INSERT INTO users (name, email, password, role, department_id)
       VALUES ($1, $2, $3, 'staff', $4)
       RETURNING id, name, email, role, department_id`,
      [cleanedName, cleanedEmail, hashed, department_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/complaints', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, u.name AS student_name, d.name AS department_name
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       ORDER BY c.created_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/analytics', async (req, res, next) => {
  try {
    const total = await query('SELECT COUNT(*) FROM complaints');
    const open = await query(
      `SELECT COUNT(*) FROM complaints WHERE status = 'Open'`,
    );
    const resolved = await query(
      `SELECT COUNT(*) FROM complaints WHERE status = 'Resolved'`,
    );
    const perDept = await query(
      `SELECT d.name, COUNT(c.id) AS count
       FROM departments d
       LEFT JOIN complaints c ON c.department_id = d.id
       GROUP BY d.name
       ORDER BY d.name`,
    );
    const issueTypeTop = await query(
      `SELECT issue_type, COUNT(*)::int AS count
       FROM complaints
       GROUP BY issue_type
       ORDER BY count DESC, issue_type ASC
       LIMIT 1`,
    );

    const totalComplaints = Number(total.rows[0].count || 0);
    const totalResolved = Number(resolved.rows[0].count || 0);
    const totalOpen = Number(open.rows[0].count || 0);
    const resolutionRate =
      totalComplaints === 0
        ? 0
        : Math.round((totalResolved / totalComplaints) * 100);
    const topIssue = issueTypeTop.rows[0] || null;

    res.json({
      total_complaints: totalComplaints,
      total_resolved: totalResolved,
      total_open: totalOpen,
      complaints_per_department: perDept.rows,
      resolution_rate: resolutionRate,
      most_common_issue_type: topIssue?.issue_type ?? 'N/A',
      most_common_issue_count: topIssue?.count ?? 0,
    });
  } catch (err) {
    next(err);
  }
});
