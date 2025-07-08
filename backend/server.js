const fs = require('fs');
require('dotenv/config');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const express = require('express');
const { runWeaver } = require('./weaver.js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const tempDir = 'temp';

const storage = multer.diskStorage({
  destination: function (req, file, cb){
    const uploadDir = path.join(tempDir, 'uploads');
    if(!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {

    // this attaches the correct file extension to the uploaded file
    // we do this because clava requires the script file to be .js
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + extension);
  }
})

const upload = multer({ storage: storage });


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening at http://localhost:${PORT}`);
  });
}

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(tempDir, req.params.filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
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
        log: log,
        outputFile: `api/download/output.zip`,
      });
    })
    .catch((error) => {
      console.error('Weaver error:', error);
      res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
    });
});

module.exports = app;