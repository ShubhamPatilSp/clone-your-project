# Automated Git Clone, Build, and S3 Upload Service

This project automates the process of cloning a Git repository, running the build scripts, and uploading the resulting artifacts to an S3 bucket. It also uses Redis for logging and integrates a reverse proxy to serve files from the S3 bucket.

## Table of Contents
- [Project Overview](#project-overview)
- [Technologies](#technologies)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Usage](#usage)
- [Docker Setup](#docker-setup)
- [Reverse Proxy](#reverse-proxy)
- [License](#license)
- [Contact](#contact)

## Project Overview
This Node.js application consists of the following components:
- Clone a Git repository.
- Build the project using the `npm run build` command.
- Upload the build files to an AWS S3 bucket.
- Use Redis to log actions during each stage.
- Provide a reverse proxy to serve files from the S3 bucket based on the subdomain.

## Technologies
- **Node.js**: Backend runtime for handling the automation.
- **AWS S3**: Used to store the build artifacts.
- **Redis**: In-memory data structure store for real-time logging.
- **Docker**: Containerization to streamline deployments.
- **Git**: Version control system used to clone the repository.
- **Express.js**: Web server to serve the reverse proxy functionality.
- **ioredis**: Redis client for Node.js.
- **@aws-sdk/client-s3**: AWS SDK to handle S3 interactions.
- **http-proxy**: For reverse proxying S3 URLs based on subdomains.

## Environment Variables
The following environment variables need to be set for the application to function correctly:
```bash
GIT_REPOSITORY__URL=your-git-repo-url
PROJECT_ID=your-project-id
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
REDIS_URL=your-redis-url
```
- GIT_REPOSITORY__URL: The URL of the Git repository to be cloned.
- PROJECT_ID: Unique identifier for the project (used for logging and S3 paths).
- AWS_ACCESS_KEY_ID: AWS IAM access key to interact with the S3 bucket.
- AWS_SECRET_ACCESS_KEY: AWS IAM secret key.
- AWS_REGION: AWS region of the S3 bucket.
- REDIS_URL: Redis connection URL for logging.

  ## Clone the repository:
```bash
git clone https://github.com/ShubhamPatilSp/clone-your-project
cd your-repo
```
## Install dependencies:
```bash
npm install
```
## .env
```bash
GIT_REPOSITORY__URL=https://github.com/your-repo.git
PROJECT_ID=my-project
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-south-1
REDIS_URL=redis://your-redis-url
```
## Run the script:
``` bash
node script.js
This will:
```
-  Clone the Git repository specified in GIT_REPOSITORY__URL.
-  Run the build command (defined in the repository's package.json).
-  Upload the build output to the S3 bucket.
-  Logs: The logs are published to the Redis instance and can be viewed in real-time.

##Docker Setup
```bash
docker build -t your-project .
```
## Run the Docker container:
```bash
docker run --env-file .env -it your-project
```
- The container will:
- Clone the repository.
- Run the build process.
- Upload the output to S3.
- Serve the built files via a reverse proxy using Express.


## Reverse Proxy
This project includes a reverse proxy that serves files from an S3 bucket based on subdomains. The proxy listens on port 8000 and forwards requests to the S3 bucket URL, appending the correct path based on the subdomain.

## Example:
- Request: project1.your-domain.com/
- Served from: https://host-your-projects.s3.ap-south-1.amazonaws.com/__outputs/project1/index.html

## License
This project is licensed under the MIT License. See the LICENSE file for details.


## Contact
## Shubham Patil
## Email: xshuubhampatil@gmail.com
