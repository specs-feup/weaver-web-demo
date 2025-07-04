/*
This file provides the functions needed to Weave the input files received by the backend server.
*/

import fs from 'fs';
import unzipper from 'unzipper';
import { exec } from 'child_process';
import path from 'path';
import archiver from 'archiver';

/**
 * Unzips a zip file to a target directory using unzipper.
 * @param {string} zipPath - Path to the zip file.
 * @param {string} targetDir - Directory to extract to.
 * @returns {Promise<void>}
 */
async function unzipFile(zipPath, targetDir) {
    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: targetDir }))
        .promise();
}

/**
 * Zips a folder to a specified output path using archiver.
 * @param {*} sourceFolder Source folder to zip
 * @param {*} outPath Output path for the zip file
 * @returns {Promise<void>}
 */
function zipFolder(sourceFolder, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', err => reject(err));

        archive.pipe(output);
        archive.directory(sourceFolder, false);
        archive.finalize();
    });
}

/**
 * This function concatenates the stdout and stderr streams of the Weaver tool and returns a string.
 */
function createLog(stdout, stderr) {
    return `stdout: ${stdout}\n\nstderr: ${stderr}`;
}

/**
 * 
 * @param {*} tool Weaver tool to run (Clava, Kadabra, etc...)
 * @param {*} inputFile The input files to be processed by the Weaver tool (can be a single file or a folder) 
 * @param {*} outputFile The output zip file where the results will be saved
 */
export async function runWeaver(tool, inputFile, scriptFile, standard) {
    const tempDir = 'temp/';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // Create the input and output directories
    const inputPath = path.join(tempDir, "input");
    //await unzipFile(inputFile, inputPath);
    const outputPath = path.join(tempDir, "output");

    // Run command
    const command = `${tool} classic tests/main.js -p ${inputPath} -o ${outputPath}/woven_code -std ${standard}`;
    console.log(`Running command: ${command}`);
    const log = await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (stderr && stderr.includes("error")) { // This is gonna stay like this for now, because docker doesnt like my M1 chip
                return reject(new Error(`Weaver tool failed: ${error}`));
            }
            resolve(createLog(stdout, stderr));
        });
    });

    const outputZip = path.join(tempDir, "output.zip");
    await zipFolder(`${outputPath}/woven_code`, outputZip);

    return log;
}