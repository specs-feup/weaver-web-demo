import request from 'supertest';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import app from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('POST /api/weave', () => {
  it('should accept a zip file upload', async () => {
    const res = await request(app)
      .post('/api/weave')
      .attach('zipfile', join(__dirname, 'test.zip'));

    expect(res.statusCode).not.toBe(400);
  });
});