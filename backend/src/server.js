import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRouter } from './routes/auth.js';
import { studentRouter } from './routes/student.js';
import { staffRouter } from './routes/staff.js';
import { adminRouter } from './routes/admin.js';
import { chatbotRouter } from './routes/chatbot.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ASTU Smart Complaint API' });
});

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/staff', staffRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatbotRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

