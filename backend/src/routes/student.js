import express from 'express';
import { query } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

export const studentRouter = express.Router();

const ISSUE_TYPES = [
  'Academic',
  'Finance',
  'Facilities',
  'IT',
  'Library',
  'Student Affairs',
  'Other',
];

studentRouter.use(authRequired, requireRole('student'));

studentRouter.get('/departments', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name
       FROM departments
       ORDER BY name`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

studentRouter.get('/issue-types', (req, res) => {
  res.json(ISSUE_TYPES);
});

studentRouter.get('/notifications', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, type, title, message, complaint_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

studentRouter.get('/notifications/unread-count', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id],
    );
    res.json({ count: result.rows[0]?.count ?? 0 });
  } catch (err) {
    next(err);
  }
});

studentRouter.patch('/notifications/read-all', async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id],
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

studentRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, message, complaint_id, is_read, created_at`,
      [id, req.user.id],
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

studentRouter.get('/complaints', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, d.name AS department_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.student_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

studentRouter.post('/complaints', async (req, res, next) => {
  try {
    const { title, description, department_id, issue_type, file_url } = req.body;
    const cleanedTitle = title?.trim();
    const cleanedDescription = description?.trim();
    const cleanedIssueType = issue_type?.trim();

    if (!cleanedTitle || !cleanedDescription || !department_id || !cleanedIssueType) {
      return res.status(400).json({
        message: 'Title, description, department, and issue type are required',
      });
    }

    if (!ISSUE_TYPES.includes(cleanedIssueType)) {
      return res.status(400).json({
        message: 'Invalid issue type',
      });
    }

    const result = await query(
      `INSERT INTO complaints
        (title, description, issue_type, status, file_url, student_id, department_id, created_at)
       VALUES ($1, $2, $3, 'Open', $4, $5, $6, NOW())
       RETURNING *`,
      [
        cleanedTitle,
        cleanedDescription,
        cleanedIssueType,
        file_url || null,
        req.user.id,
        department_id,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

studentRouter.get('/complaints/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await query(
      `SELECT c.*, d.name AS department_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.id = $1 AND c.student_id = $2`,
      [id, req.user.id],
    );
    const complaint = result.rows[0];
    if (!complaint) {
      return res.status(404).json({ message: 'Not found' });
    }

    const remarks = await query(
      `SELECT r.*, u.name AS staff_name
       FROM remarks r
       JOIN users u ON r.staff_id = u.id
       WHERE r.complaint_id = $1
       ORDER BY r.created_at ASC`,
      [id],
    );

    res.json({ complaint, remarks: remarks.rows });
  } catch (err) {
    next(err);
  }
});
