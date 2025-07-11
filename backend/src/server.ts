import * as fs from 'fs';
import 'dotenv/config';
import * as path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { runWeaver } from './weaver';
import { randomUUID} from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const tempDir = 'temp';

// This intercepts the request to /api/weave, generating a unique session ID for each request.
// Then routes the request to the actual /api/weave endpoint.
app.use('/api/weave', (req, res, next) => {;
  (req as any).sessionId = randomUUID().slice(0, 8); // Generate a short session ID
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const sessionId = (req as any).sessionId;
    const uploadDir = path.join(tempDir, sessionId, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // this attaches the correct file extension to the uploaded file
    // we do this because clava requires the script file to be .js
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + randomUUID().slice(0, 8) + extension);
  }
});

const upload = multer({ storage: storage });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening at http://localhost:${PORT}`);
  });
}

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'Backend is running!' });
});

app.get('/api/download/:sessionId/:filename', (req: Request, res: Response) => {
  const filePath = path.join(tempDir, req.params.sessionId, req.params.filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  res.download(filePath);
});

// Define proper types for multer files
interface MulterFiles {
  zipfile?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

app.post(
  '/api/weave',
  upload.fields([
    { name: 'zipfile', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    const tool = process.env.TOOL;
    const files = req.files as MulterFiles;
    const sessionId = (req as any).sessionId;

    if (!files || (!files.zipfile && !files.file)) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Get args
    const inputFile = files?.zipfile?.[0];
    const scriptFile = files?.file?.[0];
    const standard = req.body.standard;
    const sessionTempDir = path.join(tempDir, sessionId);

    runWeaver(tool || '', inputFile?.path || '', scriptFile?.path || '', standard, sessionTempDir)
      .then((log) => {
        console.log('Weaver tool executed successfully');
        res.status(200).json({
          log: log,
          outputFile: `api/download/${sessionId}/output.zip`,
        });
      })
      .catch((error) => {
        console.error('Weaver error:', error);
        res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
      });
  }
);

export default app;
