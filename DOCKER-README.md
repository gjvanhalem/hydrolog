# HydroLog - Containerized Setup Guide

HydroLog is a Next.js application for tracking hydroponic system metrics and plant growth.

## Docker Setup

This repository contains everything you need to run HydroLog in a containerized environment using Docker.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Environment Setup

1. Copy the example environment file to create your own:
   ```bash
   cp .env.example .env
   ```

2. Generate a secure JWT secret key:
   ```bash
   node generate-jwt-secret.js
   ```
   Or use the helper script:
   ```bash
   ./docker-ops.ps1 secret
   ```
   
3. Update your `.env` file with the generated secret

### Build and Run

You can use the provided helper script for common Docker operations:

```powershell
# Show help
./docker-ops.ps1

# Build the Docker image
./docker-ops.ps1 build

# Start the containers
./docker-ops.ps1 start

# View logs
./docker-ops.ps1 logs

# Stop the containers
./docker-ops.ps1 stop
```

Or run the commands directly:

```bash
# Build the Docker image
docker build -t hydrolog .

# Start the containers with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

### Access the Application

Once the containers are running, you can access the application at:

```
http://localhost:3000
```

### Database

The application uses a SQLite database stored in the `./data` directory. This directory is mounted as a volume in the Docker container to ensure data persistence.

### File Uploads

File uploads are stored in the `./public/uploads` directory and mounted as a volume in the container.

### Logs

Application logs are stored in the `./logs` directory and mounted as a volume in the container.

## Security Notes

- The JWT secret key is used to sign authentication tokens. Always use a strong, unique secret in production.
- The application runs as a non-root user inside the container for enhanced security.
- Environment variables containing sensitive information should never be committed to the repository.

## Container Resource Management

The container is configured with resource limits in `docker-compose.yml`:
- CPU: 1 core limit, 0.25 core reservation
- Memory: 1GB limit, 512MB reservation

Adjust these values based on your needs and server capabilities.
