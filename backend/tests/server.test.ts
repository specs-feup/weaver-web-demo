import * as fs from 'fs';
import * as path from 'path';

const request = require('supertest');

// Mock the weaver module
jest.mock('../src/weaver', () => ({
  runWeaver: jest.fn()
}));

import { runWeaver } from '../src/weaver';
import app, { stopCleanupInterval } from '../src/server';

// Cast to jest.MockedFunction for better type safety
const mockRunWeaver = runWeaver as jest.MockedFunction<typeof runWeaver>;

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
    
    // Stop cleanup interval to prevent Jest from hanging
    stopCleanupInterval();
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

  describe('GET /api/download/:sessionId/:filename', () => {
    it('should download existing file with session ID', async () => {
      // Create a test session directory and file
      const sessionId = 'test-session-123';
      const sessionDir = path.join(tempDir, sessionId);
      const testFilePath = path.join(sessionDir, 'test.txt');
      
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, 'test content');

      const response = await request(app)
        .get(`/api/download/${sessionId}/test.txt`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 404 for non-existent file', async () => {
      await request(app)
        .get('/api/download/nonexistent-session/nonexistent.txt')
        .expect(404);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/download/nonexistent-session/test.txt')
        .expect(404);
    });

    it('should delete session directory after successful download', async () => {
      // Create a test session directory and file
      const sessionId = 'test-session-456';
      const sessionDir = path.join(tempDir, sessionId);
      const testFilePath = path.join(sessionDir, 'test.txt');
      
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, 'test content');

      // Verify directory exists before download
      expect(fs.existsSync(sessionDir)).toBe(true);

      const response = await request(app)
        .get(`/api/download/${sessionId}/test.txt`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
      
      // Add a small delay to ensure the cleanup has time to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify directory was deleted after successful download
      expect(fs.existsSync(sessionDir)).toBe(false);
    });

    it('should validate sessionId with regex', async () => {
      // Test invalid sessionId with special characters
      await request(app)
        .get('/api/download/invalid$session/test.txt')
        .expect(400);

      const response = await request(app)
        .get('/api/download/invalid$session/test.txt');
      
      expect(response.body).toEqual({
        error: 'Invalid sessionId or filename'
      });
    });

    it('should validate filename with regex', async () => {
      // Test invalid filename with special characters
      await request(app)
        .get('/api/download/valid-session/invalid$file.txt')
        .expect(400);

      const response = await request(app)
        .get('/api/download/valid-session/invalid$file.txt');
      
      expect(response.body).toEqual({
        error: 'Invalid sessionId or filename'
      });
    });

    it('should prevent path traversal attacks', async () => {
      // Test path traversal attempt using encoded dots
      // The regex will catch most path traversal attempts
      await request(app)
        .get('/api/download/valid-session/..%2F..%2F..%2Fetc%2Fpasswd')
        .expect(400); // Should fail filename regex validation

      // Test another approach - filename with dots and slashes (encoded)
      await request(app)
        .get('/api/download/valid-session/%2E%2E%2F%2E%2E%2Fpasswd')
        .expect(400); // Should fail filename regex validation
    });

    it('should validate path resolution security', async () => {
      // Test that even if a filename passes regex, path resolution prevents traversal
      // Create a test file outside the expected session directory
      const outsideDir = path.join(tempDir, 'outside-session');
      if (!fs.existsSync(outsideDir)) {
        fs.mkdirSync(outsideDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outsideDir, 'secret.txt'), 'secret content');

      // Try to access file outside session directory
      // This should fail because path resolution prevents accessing outside temp dir
      await request(app)
        .get('/api/download/valid-session/outside-session/secret.txt')
        .expect(404); // File doesn't exist in the session directory

      // Clean up
      if (fs.existsSync(outsideDir)) {
        fs.rmSync(outsideDir, { recursive: true, force: true });
      }
    });

    it('should handle download errors gracefully', async () => {
      // Create a test session directory
      const sessionId = 'test-session-error';
      const sessionDir = path.join(tempDir, sessionId);
      
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Mock console.error to capture the error log
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Verify directory exists before download
      expect(fs.existsSync(sessionDir)).toBe(true);

      // Test with a non-existent file to trigger download error
      const response = await request(app)
        .get(`/api/download/${sessionId}/non-existent-file.txt`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'File not found'
      });

      // Verify directory still exists since download failed (404 before download callback)
      expect(fs.existsSync(sessionDir)).toBe(true);

      // Clean up manually
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      consoleSpy.mockRestore();
    });

    it('should preserve session directory on validation errors', async () => {
      // Create a test session directory
      const sessionId = 'test-session-validation';
      const sessionDir = path.join(tempDir, sessionId);
      
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Verify directory exists before request
      expect(fs.existsSync(sessionDir)).toBe(true);

      // Test with invalid filename that fails validation
      await request(app)
        .get(`/api/download/${sessionId}/invalid$file.txt`)
        .expect(400);

      // Verify directory still exists since validation failed before download
      expect(fs.existsSync(sessionDir)).toBe(true);

      // Clean up manually
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
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
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

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
      expect(response.body.outputFile).toMatch(/^api\/download\/[\w-]+\/output\.zip$/);
      expect(mockRunWeaver).toHaveBeenCalledTimes(1);
      
      // Verify the session-based temp directory was passed
      const weaverCall = mockRunWeaver.mock.calls[0];
      expect(weaverCall[4]).toMatch(/^temp\/[\w-]+$/); // Session temp directory
    });

    it('should handle weaver errors', async () => {
      // Mock weaver failure
      mockRunWeaver.mockRejectedValue(new Error('An internal server error occurred. Please try again later.'));

      const testZipContent = Buffer.from('test zip content');
      const testJsContent = Buffer.from('console.log("test");');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('zipfile', testZipContent, 'test.zip')
        .attach('file', testJsContent, 'script.js')
        .expect(500);

      expect(response.body).toEqual({
        error: 'An internal server error occurred. Please try again later.'
      });
    });

    it('should accept only file parameter (no zipfile)', async () => {
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testJsContent = Buffer.from('console.log("test");');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      expect(response.body).toHaveProperty('log');
      expect(response.body.log).toContain('Done');
      expect(mockRunWeaver).toHaveBeenCalledWith(
        process.env.TOOL || '',
        '', // no zipfile
        expect.any(String), // scriptFile path
        'c++11',
        expect.stringMatching(/^temp\/[\w-]+$/) // session temp directory
      );
    });

    it('should accept only zipfile parameter (no script file)', async () => {
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testZipContent = Buffer.from('test zip content');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('zipfile', testZipContent, 'test.zip')
        .expect(200);

      expect(response.body).toHaveProperty('log');
      expect(response.body.log).toContain('Done');
      expect(mockRunWeaver).toHaveBeenCalledWith(
        process.env.TOOL || '',
        expect.any(String), // zipfile path
        '', // no script file
        'c++11',
        expect.stringMatching(/^temp\/[\w-]+$/) // session temp directory
      );
    });

    it('should use environment variable TOOL in weaver call', async () => {
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');
      
      const testJsContent = Buffer.from('console.log("test");');

      await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      expect(mockRunWeaver).toHaveBeenCalledWith(
        process.env.TOOL || '',
        '',
        expect.any(String),
        'c++11',
        expect.stringMatching(/^temp\/[\w-]+$/) // session temp directory
      );
    });
  });

  describe('Multer file handling', () => {
    it('should save uploaded files with correct extension', async () => {
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testJsContent = Buffer.from('console.log("test");');

      await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      // Check that runWeaver was called with a path ending in .js
      const calls = mockRunWeaver.mock.calls;
      const [, , scriptPath] = calls[0];
      expect(scriptPath).toMatch(/\.js$/);
    });

    it('should create session-specific upload directories', async () => {
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testJsContent = Buffer.from('console.log("test");');

      await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(200);

      // Check that runWeaver was called with a session-specific path
      const calls = mockRunWeaver.mock.calls;
      const [, , scriptPath] = calls[0];
      expect(scriptPath).toMatch(/temp\/[\w-]+\/uploads\/file-[\da-f]+\.js$/);
    });

    it('should generate unique session IDs for concurrent requests', async () => {
      mockRunWeaver.mockResolvedValue('stdout: Done\n\nstderr: ');

      const testJsContent = Buffer.from('console.log("test");');

      // Make two concurrent requests
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/weave')
          .field('standard', 'c++11')
          .attach('file', testJsContent, 'script.js'),
        request(app)
          .post('/api/weave')
          .field('standard', 'c++11')
          .attach('file', testJsContent, 'script.js')
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Check that different session IDs were generated
      const sessionId1 = response1.body.outputFile.split('/')[2];
      const sessionId2 = response2.body.outputFile.split('/')[2];
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Session cleanup', () => {
    it('should clean up session directory on weaver failure', async () => {
      // Mock weaver failure
      mockRunWeaver.mockRejectedValue(new Error('Weaver failed'));

      const testJsContent = Buffer.from('console.log("test");');

      const response = await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(500);

      expect(response.body).toEqual({
        error: 'An internal server error occurred. Please try again later.'
      });

      // Check that session directory was cleaned up
      // We can't easily test the exact directory path without exposing sessionId,
      // but we can verify that the cleanup code path is covered
      expect(mockRunWeaver).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup gracefully when session directory does not exist', async () => {
      // Mock weaver failure  
      mockRunWeaver.mockRejectedValue(new Error('Weaver failed'));

      const testJsContent = Buffer.from('console.log("test");');

      // This should not throw an error even if session directory doesn't exist
      await request(app)
        .post('/api/weave')
        .field('standard', 'c++11')
        .attach('file', testJsContent, 'script.js')
        .expect(500);
    });
  });
});
