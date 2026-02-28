import { query } from '../db.js';

export async function createNotification({
  userId,
  type,
  title,
  message,
  complaintId = null,
}) {
  await query(
    `INSERT INTO notifications (user_id, type, title, message, complaint_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, type, title, message, complaintId],
  );
}
