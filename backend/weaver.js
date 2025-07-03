/*
This file provides the functions needed to Weave the input files received by the backend server.
*/

import fs from 'fs';
import unzipper from 'unzipper';
import { exec } from 'child_process';

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
 * 
 * @param {*} tool Weaver tool to run (Clava, Kadabra, etc...)
 * @param {*} inputFile The input files to be processed by the Weaver tool (can be a single file or a folder) 
 * @param {*} outputFile The output zip file where the results will be saved
 */
export async function runWeaver(tool, inputFile, outputFile) {
    const tempDir = 'temp/';
    
    // Ensure the temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // Unzip the input file to the temp directory
    await unzipFile(inputFile, 'temp/');

    // Build command
    await new Promise((resolve, reject) => {
        exec('npx build', (error, stdout, stderr) => {
            if (error){
                return reject(new Error(`Build failed: ${stderr}`));
            }
            resolve();
        })
    })

    // Run command
    const command = `npx ${tool} classic dist/main.js -p ${tempDir}`;
    await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Weaver tool failed: ${stderr}`));
            }
            resolve(stdout);
        });
    });

}