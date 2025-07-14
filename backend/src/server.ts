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

// Cleanup old session directories (older than 1 hour)
const cleanupOldSessions = () => {
  if (!fs.existsSync(tempDir)) return;
  
  const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in milliseconds
  
  try {
    const sessionDirs = fs.readdirSync(tempDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const sessionDir of sessionDirs) {
      const sessionPath = path.join(tempDir, sessionDir);
      const stats = fs.statSync(sessionPath);
      
      // Remove directories older than 1 hour
      if (stats.mtime.getTime() < oneHourAgo) {
        console.log(`Cleaning up old session directory: ${sessionDir}`);
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Error during session cleanup:', error);
  }
};

// Run cleanup every 30 minutes
let cleanupInterval: NodeJS.Timeout | null = null;

// Only start cleanup interval when server is running (not during tests)
const startCleanupInterval = () => {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupOldSessions, 30 * 60 * 1000);
    // Run cleanup on startup
    cleanupOldSessions();
  }
};

// Export cleanup function for tests
export const stopCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// This intercepts the request to /api/weave, generating a unique session ID for each request.
// Then routes the request to the actual /api/weave endpoint.
app.use('/api/weave', (req, res, next) => {
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
    // Start cleanup interval only when server is running
    startCleanupInterval();
  });
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/download/:sessionId/:filename', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const filename = req.params.filename;

    // Validate sessionId and filename
  const sessionIdRegex = /^[a-zA-Z0-9_-]+$/;
  const filenameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!sessionIdRegex.test(sessionId) || !filenameRegex.test(filename)) {
    res.status(400).json({ error: 'Invalid sessionId or filename' });
    return;
  }

  // Construct and resolve the file path
  const filePath = path.resolve(tempDir, sessionId, filename);
  const tempDirPath = path.resolve(tempDir);

  // Ensure the resolved path is within the temp directory
  const relativePath = path.relative(tempDirPath, filePath);
  if (relativePath.startsWith('..')) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  res.download(filePath, (err) => {
    if (!err){
      const sessionDir = path.join(tempDir, sessionId);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } 
    else{
      console.error(`Error during file download: ${err.message}`);
    }
  });
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
        
        // Clean up session directory on weaver failure
        if (fs.existsSync(sessionTempDir)) {
          fs.rmSync(sessionTempDir, { recursive: true, force: true });
        }
        
        res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
      });
  }
);

export default app;
