/*
This file provides the functions needed to Weave the input files received by the backend server.
*/

import * as fs from 'fs';
import { exec } from 'child_process';
import * as path from 'path';

const unzipper = require('unzipper');
const archiver = require('archiver');

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
        archive.directory(sourceFolder, false);
        archive.finalize();
    });
}

/**
 * Returns the concatenated log string from stdout and stderr.
 * @param stdout The standard output from the Weaver tool
 * @param stderr The standard error output from the Weaver tool
 * @returns The formatted log string
 */
function createLog(stdout: string, stderr: string): string {
    return `stdout: ${stdout}\n\nstderr: ${stderr}`;
}

/**
 * 
 * @param tool The Weaver tool to use (e.g., 'clava')
 * @param inputFile The input file to weave, which is a zip file that will be unzipped
 * @param scriptFile The javascript file to use for weaving
 * @param standard The standard to use for weaving (e.g., 'c++11')
 * @param tempDir The temporary directory to use for input and output files (default is 'temp/')
 * @returns A promise that resolves to the log string from the Weaver tool
 */
async function runWeaver(
    tool: string, 
    inputFile: string, 
    scriptFile: string, 
    standard: string, 
    tempDir: string = 'temp/'
): Promise<string> {

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

    // Run command
    // The woven code will be saved in the temp/woven_code folder
    let command = `${tool} classic ${scriptFile} -p ${inputPath} -o ${tempDir}`;

    // Only clava has a standard option
    if (tool === 'clava' && standard){
        command = command.concat(` -std ${standard}`);
    }
    console.log(`Running command: ${command}`);

    const log = await new Promise<string>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Weaver tool failed: ${error.message}`));
            }
            if (stderr && stderr.includes("error")) {
                return reject(new Error(`Weaver tool stderr contains error: ${stderr}`));
            }
            resolve(createLog(stdout, stderr));
        });
    });

    const outputZipPath = path.join(tempDir, "output.zip");
    await zipFolder(path.join(tempDir, 'woven_code'), outputZipPath);

    return log;
}

export {
    runWeaver
};
