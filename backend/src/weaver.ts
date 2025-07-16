/*
This file provides the functions needed to Weave the input files received by the backend server.
*/

import * as fs from 'fs';
import * as path from 'path';
import unzipper from 'unzipper';
import archiver from 'archiver';
import { execFile } from 'child_process';

/**
 * Unzips a zip file to a target directory using unzipper.
 * @param zipPath - Path to the zip file.
 * @param targetDir - Directory to extract to.
 * @returns Promise<void>
 */
async function unzipFile(zipPath: string, targetDir: string): Promise<void> {
    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: targetDir }))
        .promise();
}

/**
 * Zips a folder to a specified output path using archiver.
 * @param sourceFolder Source folder to zip
 * @param outPath Output path for the zip file
 * @returns Promise<void>
 */
function zipFolder(sourceFolder: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err: Error) => reject(err));

        archive.pipe(output);
        // Include the folder itself in the zip with the name "woven_code"
        archive.directory(sourceFolder, 'woven_code');
        archive.finalize();
    });
}

/**
 * 
 * @param tool The Weaver tool to use (e.g., 'clava')
 * @param inputFile The input file to weave, which is a zip file that will be unzipped
 * @param scriptFile The javascript file to use for weaving
 * @param standard The standard to use for weaving (e.g., 'c++11')
 * @param tempDir The temporary directory to use for input and output files (default is 'temp/')
 * @returns A promise that resolves to an object with log content string and path to woven code zip
 */
async function runWeaver(
    tool: string, 
    inputFile: string, 
    scriptFile: string, 
    standard: string, 
    tempDir: string = 'temp/'
){

    // Throw error if any of the required parameters are missing
    if (!tool) {
        throw new Error("Missing required parameters: tool");
    }
    if (!inputFile) {
        throw new Error("Missing required parameters: inputFile");
    }
    if (!scriptFile) {
        throw new Error("Missing required parameters: scriptFile");
    }

    // Create the input and output directories
    const inputPath = path.join(tempDir, "input");
    await unzipFile(inputFile, inputPath);
    const resultFolderName = 'woven_code';
    const logFileName = 'log.txt';

    // -l outputs the log into a log.txt file
    const args = ['classic', scriptFile, '-p', inputPath, '-o', tempDir];

    // Only clava has a standard option
    if (tool === 'clava' && standard) {
        args.push('-std', standard);
    }

    console.log(`Running command: ${tool} ${args.join(' ')}`);

    let logContent = '';

    await new Promise<void>((resolve, reject) => {
        execFile(tool, args, (error, stdout, stderr) => {
            // Concatenate stdout and stderr for the log
            logContent = stdout + stderr;
            
            if (error) {
                reject(new Error(`Weaver tool failed: ${error.message}\n${stderr}`));
            } else if (stderr && /error/i.test(stderr)) {
                reject(new Error(`Weaver tool stderr contains error: ${stderr}`));
            } else {
                resolve();
            }
        });
    });

    const outputZipPath = path.join(tempDir, `${resultFolderName}.zip`);
    
    // Zip the 'input' folder inside the 'woven_code' folder, but name it 'woven_code' in the ZIP
    const inputFolderInWovenCode = path.join(tempDir, resultFolderName, 'input');
    await zipFolder(inputFolderInWovenCode, outputZipPath);

    // Return the log content directly and path to zip file
    return {
        logContent: logContent,
        wovenCodeZip: outputZipPath
    };
}

export {
    runWeaver
};
