require("dotenv").config();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const Redis = require("ioredis");

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

const OUTPUT_DIR = path.join(__dirname, "output");

function publishLog(log) {
  const logData = {
    log,
    projectId: process.env.PROJECT_ID,
    timestamp: new Date().toISOString(),
  };
  redis.publish(`logs:${process.env.PROJECT_ID}`, JSON.stringify(logData));
  console.log(log);
}

async function main() {
  console.log("Environment variables:");
  console.log("REDIS_URL:", process.env.REDIS_URL);
  console.log("PROJECT_ID:", process.env.PROJECT_ID);
  console.log("GIT_REPOSITORY_URL:", process.env.GIT_REPOSITORY_URL);

  const gitRepoUrl = process.env.GIT_REPOSITORY_URL;
  const projectId = process.env.PROJECT_ID;

  if (!gitRepoUrl || !projectId) {
    publishLog(
      "Error: GIT_REPOSITORY_URL or PROJECT_ID environment variable is missing."
    );
    return;
  }

  publishLog(`Cloning repository: ${gitRepoUrl}`);

  exec(`git clone ${gitRepoUrl} ${OUTPUT_DIR}`, (error, stdout, stderr) => {
    if (error) {
      publishLog(`Error cloning repository: ${error.message}`);
      return;
    }
    if (stderr) {
      publishLog(`Clone stderr: ${stderr}`);
    }
    publishLog(`Repository cloned successfully.`);

    // Read package.json
    const packageJsonPath = path.join(OUTPUT_DIR, "package.json");
    fs.readFile(packageJsonPath, "utf8", (err, data) => {
      if (err) {
        publishLog(`Error reading package.json: ${err.message}`);
        return;
      }
      try {
        const packageJson = JSON.parse(data);
        const buildCommand = packageJson.scripts && packageJson.scripts.build;
        if (buildCommand) {
          publishLog(`Starting build process with command: ${buildCommand}`);
          exec(
            `cd ${OUTPUT_DIR} && npm install && npm run build`,
            (buildError, buildStdout, buildStderr) => {
              if (buildError) {
                publishLog(`Build error: ${buildError.message}`);
                return;
              }
              publishLog(`Build stdout: ${buildStdout}`);
              if (buildStderr) {
                publishLog(`Build stderr: ${buildStderr}`);
              }
              publishLog("Build process completed.");
            }
          );
        } else {
          publishLog("No build script found in package.json");
        }
      } catch (parseError) {
        publishLog(`Error parsing package.json: ${parseError.message}`);
      }
    });
  });
}

main().catch((error) => {
  publishLog(`Unhandled error: ${error.message}`);
});
