// backend/server.js
import 'dotenv/config';
import cors from 'cors';
import multer from 'multer';
import express, { json } from 'express';
import { exec } from 'child_process';
import { runWeaver } from './weaver.js';

const app = express();
const PORT = process.env.PORT || 4000;
const TOOL = process.env.TOOL;

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.get(`/${TOOL}`, (req, res) => {

  const command = `${TOOL} --version`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`${TOOL} error`, error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  });
});

app.post('/api/weave', upload.single('zipfile'), (req, res) => {

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

});

app.listen(PORT, () => {
  console.log(`🚀 Backend listening at http://localhost:${PORT}`);
});
