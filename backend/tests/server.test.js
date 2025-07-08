const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock the weaver module
jest.mock('../weaver.js', () => ({
  runWeaver: jest.fn()
}));

const { runWeaver } = require('../weaver.js');
const app = require('../server.js');

describe('Server API Tests', () => {
  const tempDir = 'temp';
  
  beforeAll(() => {
    // Ensure temp directory exists for tests
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up temp directory after tests
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/status', () => {
    it('should return backend status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toEqual({
        status: 'Backend is running!'
      });
    });
  });

  describe('GET /api/download/:filename', () => {
    it('should download existing file', async () => {
      // Create a test file
      const testFilePath = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testFilePath, 'test content');

      const response = await request(app)
        .get('/api/download/test.txt')
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 404 for non-existent file', async () => {
      await request(app)
        .get('/api/download/nonexistent.txt')
        .expect(404);
    });
  });

  describe('POST /api/weave', () => {
    it('should return error when no files uploaded', async () => {
      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .expect(400);

      expect(response.body).toEqual({
        error: 'No file uploaded'
      });
    });

    it('should process files successfully and return log with Done', async () => {
      // Mock successful weaver execution
      runWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      // Create test files
      const testZipContent = Buffer.from('test zip content');
      const testJsContent = Buffer.from('console.log("test");');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('zipfile', testZipContent, 'test.zip')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      expect(response.body).toHaveProperty('log');
      expect(response.body).toHaveProperty('outputFile');
      expect(response.body.log).toContain('Done');
      expect(response.body.outputFile).toBe('api/download/output.zip');
      expect(runWeaver).toHaveBeenCalledTimes(1);
    });

    it('should handle weaver errors', async () => {
      // Mock weaver failure
      runWeaver.mockRejectedValue(new Error('Weaver tool failed'));

      const testZipContent = Buffer.from('test zip content');
      const testJsContent = Buffer.from('console.log("test");');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('zipfile', testZipContent, 'test.zip')
        .attach('file', testJsContent, 'script.js')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Weaver tool failed'
      });
    });

    it('should accept only file parameter (no zipfile)', async () => {
      runWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testJsContent = Buffer.from('console.log("test");');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      expect(response.body).toHaveProperty('log');
      expect(response.body.log).toContain('Done');
      expect(runWeaver).toHaveBeenCalledWith(
        process.env.TOOL,
        undefined, // no zipfile
        expect.any(String), // scriptFile path
        'c++11'
      );
    });

    it('should accept only zipfile parameter (no script file)', async () => {
      runWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testZipContent = Buffer.from('test zip content');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('zipfile', testZipContent, 'test.zip')
        .expect(200);

      expect(response.body).toHaveProperty('log');
      expect(response.body.log).toContain('Done');
      expect(runWeaver).toHaveBeenCalledWith(
        process.env.TOOL,
        expect.any(String), // zipfile path
        undefined, // no script file
        'c++11'
      );
    });

    it('should use environment variable TOOL in weaver call', async () => {
      runWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');
      
      const testJsContent = Buffer.from('console.log("test");');

      await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      expect(runWeaver).toHaveBeenCalledWith(
        process.env.TOOL,
        undefined,
        expect.any(String),
        'c++11'
      );
    });
  });

  describe('Multer file handling', () => {
    it('should save uploaded files with correct extension', async () => {
      runWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testJsContent = Buffer.from('console.log("test");');

      await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      // Check that runWeaver was called with a path ending in .js
      const [[, , scriptPath]] = runWeaver.mock.calls;
      expect(scriptPath).toMatch(/\.js$/);
    });
  });
});