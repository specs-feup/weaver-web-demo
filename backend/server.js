import 'dotenv/config';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import express from 'express';
import { exec } from 'child_process';
import { runWeaver } from './weaver.js';

const app = express();
const PORT = process.env.PORT || 4000;
const extension = process.env.EXT;

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening at http://localhost:${PORT}`);
  });
}

app.get(`/api/:tool`, (req, res) => {
  const tool = req.params.tool || process.env.TOOL;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`${tool} error`, error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  });
});

app.post(
  '/api/weave',
  upload.fields([
    {name: 'zipfile', maxCount: 1},
    {name: 'file', maxCount: 1},
  ]),
  (req, res) => {
  const tool = process.env.TOOL;

  if (!req.files || (!req.files.zipfile && !req.files.file)) 
    return res.status(400).json({ error: 'No file uploaded' });

  // Get args
  const inputFile = req.files?.zipfile?.[0];
  const scriptFile = req.files?.file?.[0];
  const standard = req.body.standard;

  runWeaver(tool, inputFile?.path, scriptFile?.path, standard)
    .then((log) => {
      console.log('Weaver tool executed successfully');
      res.status(200).json({
        log: log
      });
    })
    .catch((error) => {
      console.error('Weaver error:', error);
      res.status(500).json({ error: error.message });
    });
});

export default app;