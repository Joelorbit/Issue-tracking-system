import express from 'express';
import { query } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { createNotification } from '../lib/notifications.js';

export const staffRouter = express.Router();

const STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const ALLOWED_STATUS_VALUES = Object.values(STATUS);
const STATUS_TRANSITIONS = {
  [STATUS.OPEN]: [STATUS.IN_PROGRESS],
  [STATUS.IN_PROGRESS]: [STATUS.RESOLVED],
  [STATUS.RESOLVED]: [],
};

staffRouter.use(authRequired, requireRole('staff'));

staffRouter.get('/complaints', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, u.name AS student_name, d.name AS department_name
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.department_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.department_id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

staffRouter.get('/complaints/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await query(
      `SELECT c.*, u.name AS student_name, d.name AS department_name
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.id = $1 AND c.department_id = $2`,
      [id, req.user.department_id],
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

staffRouter.patch('/complaints/:id/status', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!ALLOWED_STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const current = await query(
      `SELECT status, department_id, student_id, title FROM complaints WHERE id = $1`,
      [id],
    );
    const row = current.rows[0];
    if (!row || row.department_id !== req.user.department_id) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (!STATUS_TRANSITIONS[row.status]?.includes(status)) {
      return res
        .status(400)
        .json({ message: 'Invalid status transition for this complaint' });
    }

    const updated = await query(
      `UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );

    await createNotification({
      userId: row.student_id,
      type: 'status_update',
      title: `Status updated: ${row.title}`,
      message: `Your complaint is now "${status}".`,
      complaintId: id,
    });

    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

staffRouter.post('/complaints/:id/remarks', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { message } = req.body;
    const cleanedMessage = message?.trim();
    if (!cleanedMessage) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const check = await query(
      `SELECT id, student_id, title
       FROM complaints
       WHERE id = $1 AND department_id = $2`,
      [id, req.user.department_id],
    );
    if (check.rowCount === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    const result = await query(
      `WITH inserted AS (
         INSERT INTO remarks (complaint_id, staff_id, message, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *
       )
       SELECT i.*, u.name AS staff_name
       FROM inserted i
       JOIN users u ON u.id = i.staff_id`,
      [id, req.user.id, cleanedMessage],
    );

    await createNotification({
      userId: check.rows[0].student_id,
      type: 'new_remark',
      title: `New remark: ${check.rows[0].title}`,
      message: `Staff added a new remark to your complaint.`,
      complaintId: id,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});
