const path = require('path');

// Mock modules
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

jest.mock('fs', () => ({
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn()
}));

jest.mock('unzipper', () => ({
  Extract: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue() // This needs to resolve
  })
}));

jest.mock('archiver', () => {
  const mockArchive = {
    pipe: jest.fn(),
    directory: jest.fn(),
    finalize: jest.fn(),
    on: jest.fn()
  };
  return jest.fn(() => mockArchive);
});

const { exec } = require('child_process');
const fs = require('fs');
const unzipper = require('unzipper');
const archiver = require('archiver');
const { runWeaver } = require('../weaver.js');

describe('Weaver Functions', () => {
  const testTempDir = 'test-temp';
  const testInputFile = 'test-input.zip';
  const testScriptFile = 'test-script.js';
  const testStandard = 'c++11';
  const testTool = 'clava';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fs mocks - THIS IS THE KEY FIX
    fs.existsSync.mockReturnValue(true);
    
    // Mock the pipe chain that actually resolves
    const mockExtract = unzipper.Extract();
    fs.createReadStream.mockReturnValue({
      pipe: jest.fn().mockReturnValue(mockExtract)
    });
    
    fs.createWriteStream.mockReturnValue({
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(), 0); // Simulate async close
        }
      })
    });

    // Setup archiver mock
    const mockArchive = archiver();
    mockArchive.on.mockImplementation((event, callback) => {
      if (event === 'error') return mockArchive;
      if (event === 'close') {
        setTimeout(() => callback(), 0); // Simulate async close
      }
      return mockArchive;
    });
  });

  describe('runWeaver', () => {
    it('should execute weaver command successfully and return Done log', async () => {
      // Mock successful exec with "Done" in stdout
      exec.mockImplementation((command, callback) => {
        expect(command).toContain('clava classic');
        expect(command).toContain(testScriptFile);
        expect(command).toContain(testStandard);
        callback(null, 'Processing files... Done', '');
      });

      const result = await runWeaver(
        testTool,
        testInputFile,
        testScriptFile,
        testStandard,
        testTempDir
      );

      expect(result).toBe('stdout: Processing files... Done\n\nstderr: ');
      expect(result).toContain('Done');
      expect(exec).toHaveBeenCalledTimes(1);
    });

    it('should handle weaver command errors', async () => {
      // Mock exec with error
      exec.mockImplementation((command, callback) => {
        callback(new Error('Command failed'), '', 'error output');
      });

      await expect(
        runWeaver(testTool, testInputFile, testScriptFile, testStandard, testTempDir)
      ).rejects.toThrow('Weaver tool failed');
    });

    it('should build correct command with all parameters', async () => {
      exec.mockImplementation((command, callback) => {
        expect(command).toBe(
          `${testTool} classic ${testScriptFile} -p ${testTempDir}/input -o ${testTempDir} -std ${testStandard}`
        );
        callback(null, 'Done', '');
      });

      await runWeaver(testTool, testInputFile, testScriptFile, testStandard, testTempDir);
    });

    it('should use default temp directory when not provided', async () => {
      exec.mockImplementation((command, callback) => {
        expect(command).toContain('-o temp/');
        expect(command).toContain('-p temp/input');
        callback(null, 'Done', '');
      });

      await runWeaver(testTool, testInputFile, testScriptFile, testStandard);
    });

    it('should call unzipFile to extract input archive', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, 'Done', '');
      });

      await runWeaver(testTool, testInputFile, testScriptFile, testStandard, testTempDir);

      // Verify that createReadStream was called with the input file
      expect(fs.createReadStream).toHaveBeenCalledWith(testInputFile);
    });

    it('should call zipFolder to create output archive', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, 'Done', '');
      });

      const mockArchive = archiver();
      
      await runWeaver(testTool, testInputFile, testScriptFile, testStandard, testTempDir);

      // Verify that archiver was called
      expect(archiver).toHaveBeenCalledWith('zip', { zlib: { level: 9 } });
      expect(mockArchive.directory).toHaveBeenCalledWith(`${testTempDir}woven_code`, false);
      expect(mockArchive.finalize).toHaveBeenCalled();
    });

    it('should create correct input and output paths', async () => {
      exec.mockImplementation((command, callback) => {
        // Verify the command contains the correct input path
        expect(command).toContain(`-p ${testTempDir}/input`);
        // Verify the command contains the correct output directory
        expect(command).toContain(`-o ${testTempDir}`);
        callback(null, 'Done', '');
      });

      await runWeaver(testTool, testInputFile, testScriptFile, testStandard, testTempDir);
    });
  });

  describe('createLog function (tested via runWeaver)', () => {
    it('should format stdout and stderr correctly', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, 'Weaving complete: Done', 'Some warnings');
      });

      const result = await runWeaver(
        testTool,
        testInputFile,
        testScriptFile,
        testStandard,
        testTempDir
      );

      expect(result).toBe('stdout: Weaving complete: Done\n\nstderr: Some warnings');
      expect(result).toContain('Done');
    });

    it('should handle empty stderr', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, 'Processing: Done', '');
      });

      const result = await runWeaver(
        testTool,
        testInputFile,
        testScriptFile,
        testStandard,
        testTempDir
      );

      expect(result).toBe('stdout: Processing: Done\n\nstderr: ');
      expect(result).toContain('Done');
    });
  });

  describe('File operations', () => {
    it('should handle zip creation with correct paths', async () => {
      exec.mockImplementation((command, callback) => {
        callback(null, 'Done', '');
      });

      const mockWriteStream = { 
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(), 0);
          }
        })
      };
      fs.createWriteStream.mockReturnValue(mockWriteStream);

      await runWeaver(testTool, testInputFile, testScriptFile, testStandard, testTempDir);

      // Verify output zip path creation
      expect(fs.createWriteStream).toHaveBeenCalledWith(
        path.join(testTempDir, 'output.zip')
      );
    });
  });
});