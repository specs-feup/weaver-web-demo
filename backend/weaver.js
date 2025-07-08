/*
This file provides the functions needed to Weave the input files received by the backend server.
*/

const fs = require('fs');
const unzipper = require('unzipper');
const { exec } = require('child_process');
const path = require('path');
const archiver = require('archiver');

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
 * Returns the concatenated log string from stdout and stderr.
 * @param {*} stdout The standard output from the Weaver tool
 * @param {*} stderr The standard error output from the Weaver tool
 * @returns 
 */
function createLog(stdout, stderr) {
    return `stdout: ${stdout}\n\nstderr: ${stderr}`;
}

/**
 * 
 * @param {*} tool The Weaver tool to use (e.g., 'clava')
 * @param {*} inputFile The input file to weave, which is a zip file that will be unzipped
 * @param {*} scriptFile The javascript file to use for weaving
 * @param {*} standard The standard to use for weaving (e.g., 'c++11')
 * @param {*} tempDir The temporary directory to use for input and output files (default is 'temp/')
 * @returns {Promise<string>} A promise that resolves to the log string from the Weaver tool
 */
async function runWeaver(tool, inputFile, scriptFile, standard, tempDir = 'temp/') {

    // Create the input and output directories
    const inputPath = path.join(tempDir, "input");
    await unzipFile(inputFile, inputPath);

    // Run command
    // The woven code will be saved in the temp/woven_code folder
    const command = `${tool} classic ${scriptFile} -p ${inputPath} -o ${tempDir} -std ${standard}`;
    console.log(`Running command: ${command}`);

    const log = await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (stderr && stderr.includes("error")) { // This is gonna stay like this for now, because docker doesnt like my M1 chip
                return reject(new Error(`Weaver tool failed: ${error}`));
            }
            resolve(createLog(stdout, stderr));
        });
    });

    const outputZipPath = path.join(tempDir, "output.zip");
    await zipFolder(`${tempDir}woven_code`, outputZipPath);

    return log;
}

module.exports = {
    runWeaver
};