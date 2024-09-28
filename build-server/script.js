require("dotenv").config();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const PROJECT_ID = process.env.PROJECT_ID;
const GIT_REPOSITORY_URL = process.env.GIT_REPOSITORY__URL;
const OUTPUT_DIR = path.join(__dirname, "output");

let publisher;

try {
  publisher = new Redis(REDIS_URL);
} catch (error) {
  console.error("Failed to connect to Redis:", error);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function publishLog(log) {
  console.log(log);
  if (publisher) {
    publisher
      .publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
      .catch(console.error);
  }
}

async function cloneRepository() {
  if (!GIT_REPOSITORY_URL) {
    throw new Error("GIT_REPOSITORY__URL is not set");
  }
  publishLog(`Cloning repository: ${GIT_REPOSITORY_URL}`);
  return new Promise((resolve, reject) => {
    exec(
      `git clone ${GIT_REPOSITORY_URL} ${OUTPUT_DIR}`,
      (error, stdout, stderr) => {
        if (error) {
          publishLog(`Error cloning repository: ${error.message}`);
          reject(error);
        } else {
          publishLog("Repository cloned successfully");
          resolve();
        }
      }
    );
  });
}

async function buildProject() {
  publishLog("Starting build process...");
  return new Promise((resolve, reject) => {
    exec(
      `cd ${OUTPUT_DIR} && npm install && npm run build`,
      (error, stdout, stderr) => {
        if (error) {
          publishLog(`Build error: ${error.message}`);
          reject(error);
        } else {
          publishLog("Build completed successfully");
          resolve();
        }
      }
    );
  });
}

async function uploadToS3(distPath) {
  const files = fs.readdirSync(distPath, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) continue;
    const filePath = path.join(distPath, file.name);
    publishLog(`Uploading ${file.name}`);
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `__outputs/${PROJECT_ID}/${file.name}`,
      Body: fs.createReadStream(filePath),
      ContentType: mime.lookup(filePath) || "application/octet-stream",
    });
    try {
      await s3Client.send(command);
      publishLog(`Uploaded ${file.name}`);
    } catch (error) {
      publishLog(`Error uploading ${file.name}: ${error.message}`);
    }
  }
}

async function init() {
  try {
    publishLog("Executing script.js");
    await cloneRepository();
    await buildProject();
    const distPath = path.join(OUTPUT_DIR, "dist");
    if (!fs.existsSync(distPath)) {
      throw new Error(
        "dist folder not found. Make sure your build script creates a 'dist' folder."
      );
    }
    await uploadToS3(distPath);
    publishLog("Process completed successfully");
  } catch (error) {
    publishLog(`Error: ${error.message}`);
  } finally {
    if (publisher) {
      publisher.quit();
    }
    process.exit(0);
  }
}
