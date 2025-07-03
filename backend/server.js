// backend/server.js
import express, { json } from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.get('/clava', (req, res) => {
  const command = 'clava --version';

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Clava error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend listening at http://localhost:${PORT}`);
});
