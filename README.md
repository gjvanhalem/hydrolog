# HydroLog: Hydroponic Growth Tracking System

<div align="center">
  <img src="./public/hydrolog-logo.svg" alt="HydroLog Logo" width="300"/>
</div>

HydroLog is a comprehensive web application designed to help hydroponic growers track, monitor, and optimize their plant growth. Whether you're a hobbyist with a small home setup or managing a larger hydroponic system, HydroLog provides the tools you need to maintain detailed records and improve your growing results.

## 🌱 Features

### System Management
- **Multi-System Support**: Track multiple hydroponic systems simultaneously
- **Customizable Layouts**: Configure your system with flexible position layouts
- **System Activation**: Easily switch between different hydroponic systems

### Plant Tracking
- **Detailed Plant Records**: Store plant type, position, status, and growth history
- **Growth Logging**: Document plant development with notes and images
- **Visual Position Grid**: Intuitive interface showing plant placement in your system

### Monitoring & Analytics
- **Daily System Logs**: Track system-wide metrics and environmental conditions
- **Historical Data**: Review past performance and identify trends
- **Growth Reports**: Generate reports on plant development and system efficiency

### User Management
- **Secure Authentication**: User accounts with email/password authentication
- **Role-Based Access**: Control who can view and modify your hydroponic data
- **Multi-User Support**: Collaborate with team members on shared systems

## 🚀 Getting Started

HydroLog can be run either locally on your machine or via Docker containers. Choose the method that works best for your environment.

## 🖥️ Local Setup (Without Docker)

### Prerequisites
- Node.js 20.x or later
- npm 10.x or later
- Git

### Installation Steps

1. **Clone the repository**
   ```powershell
   git clone https://github.com/yourusername/hydrolog.git
   cd hydrolog
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up the database**
   ```powershell
   # Generate Prisma client
   npx prisma generate

   # Create PostgreSQL database and run migrations
   npx prisma migrate dev
   ```

4. **Configure environment variables**
   ```powershell
   # Create a .env file from the example
   Copy-Item ".env.example" -Destination ".env.local"
   
   # Edit .env.local with your settings
   # Update DATABASE_URL for your PostgreSQL connection
   ```

5. **Generate a JWT secret** (for authentication)
   ```powershell
   node generate-jwt-secret.js
   ```
   Add the generated secret to your `.env.local` file.

6. **Start the development server**
   ```powershell
   npm run dev
   ```

7. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Setup

### Prerequisites
- Docker and Docker Compose
- Git

### Docker Installation Steps

1. **Clone the repository**
   ```powershell
   git clone https://github.com/yourusername/hydrolog.git
   cd hydrolog
   ```

2. **Build and run the Docker container**
   ```powershell
   # Build the Docker image
   docker build -t hydrolog .

   # Run the container with mounted volumes for data persistence
   docker run -p 3000:3000 -v "${PWD}/data:/app/data" -v "${PWD}/logs:/app/logs" hydrolog
   ```

3. **Using Docker Compose (recommended for production)**
   ```powershell
   # Create and configure .env file first
   Copy-Item ".env.example" -Destination ".env"
   
   # Start the application stack
   docker-compose up -d
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

HydroLog supports Docker-based deployment for production environments. Follow these steps to deploy:

### Prerequisites

- Docker and Docker Compose installed on your server
- Git installed for version control
- Basic understanding of environment variables and Docker

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd hydrolog
   ```

2. Create a production environment file:
   ```bash
   cp .env.example .env.production
   ```
   Edit `.env.production` with your production settings, making sure to set:
   ```
   DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/hydrolog?schema=public
   POSTGRES_PASSWORD=your_secure_password_here
   ```

3. Build and start the containers:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

The application will be available at `http://your-server:3000`.

### Production Scripts

- `npm run docker:build` - Build the Docker image
- `npm run docker:up` - Start the application stack
- `npm run docker:down` - Stop the application stack
- `npm run docker:logs` - View application logs

### Database Management

The PostgreSQL database is persisted in a Docker volume. Regular backups are recommended:

1. Backup the database:
   ```bash
   docker exec -it postgres pg_dump -U postgres -d hydrolog > backup.sql
   ```

2. Restore from backup:
   ```bash
   docker exec -it postgres psql -U postgres -d hydrolog < backup.sql
   ```

### Health Monitoring

The application includes a health check endpoint at `/api/health`. Use this to monitor the application's status with your preferred monitoring solution.

### Security Considerations

1. The application runs with security headers enabled
2. File uploads are restricted to images only
3. All API routes are protected against common web vulnerabilities
4. Database is stored in a persistent Docker volume
5. Never commit sensitive information like database passwords to version control
6. Use environment variables for all sensitive configuration
7. For production deployment, generate a strong random password for your PostgreSQL database

### Password Management

For secure operations:
1. Set `POSTGRES_PASSWORD` in your environment or in a non-versioned `.env.production` file
2. Generate a strong random password (at least 16 characters)
3. Consider using a secrets management solution for production environments
4. Avoid hardcoding passwords in scripts or configuration files

### Troubleshooting

If you encounter issues:

1. Check the logs: `npm run docker:logs`
2. Verify environment variables are set correctly
3. Ensure all volumes are properly mounted
4. Check the Docker container status: `docker ps`

For additional deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## 🔧 Advanced Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL database connection string (default for production: `postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/hydrolog?schema=public`)
- `POSTGRES_PASSWORD`: Database password (never commit the actual password to version control)
- `JWT_SECRET`: Secret key for authentication tokens
- `LOG_LEVEL`: Logging detail level (default: `info`)
- `UPLOAD_DIR`: Directory for storing uploaded images

### PostgreSQL Setup Guide

HydroLog uses PostgreSQL for database storage. Here's how to set it up:

#### Installing PostgreSQL

**Windows:**
1. Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. During installation, note the password you set for the 'postgres' user
3. Add PostgreSQL bin directory to your PATH (typically `C:\Program Files\PostgreSQL\15\bin`)

**macOS:**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

#### Setting Up PostgreSQL for HydroLog

We've created scripts to automate PostgreSQL setup:

**Windows:**
```powershell
# Set up PostgreSQL for HydroLog
npm run db:setup:win
```

**Linux/macOS:**
```bash
# Set up PostgreSQL for HydroLog
npm run db:setup
```

These scripts will:
1. Check if PostgreSQL is installed and running
2. Create a 'hydrolog' database if it doesn't exist
3. Update your .env.local file with the PostgreSQL connection string
4. Run Prisma migrations

#### Advanced: Manual PostgreSQL Setup

If you prefer to configure PostgreSQL manually:

1. Create a database:
```sql
CREATE DATABASE hydrolog;
```

2. Update your .env.local file:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hydrolog?schema=public
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

#### Database Backup

##### With Docker:
```powershell
# Backup
docker exec -it postgres pg_dump -U postgres -d hydrolog > backup_hydrolog.sql

# Restore
docker exec -it postgres psql -U postgres -d hydrolog < backup_hydrolog.sql
```

##### Without Docker:
```powershell
# Backup
pg_dump -h localhost -U postgres -d hydrolog > backup_hydrolog.sql

# Restore
psql -h localhost -U postgres -d hydrolog < backup_hydrolog.sql
```

## 📊 Monitoring & Maintenance

### Health Check
The application includes a health check endpoint at `/api/health` that returns the system status.

### Logging
Logs are written to the `logs/` directory and can be configured via the `LOG_LEVEL` environment variable.

### Database Maintenance
Regular database maintenance tasks are recommended for optimal PostgreSQL performance:

```bash
# Inside the PostgreSQL container
docker exec -it postgres psql -U postgres -d hydrolog -c "VACUUM ANALYZE;"
```

### Monitoring PostgreSQL
You can monitor PostgreSQL performance using standard tools:

```bash
# Check PostgreSQL status
docker exec -it postgres pg_isready

# View PostgreSQL logs
docker exec -it postgres tail -f /var/log/postgresql/postgresql-15-main.log

# Monitor active connections
docker exec -it postgres psql -U postgres -d hydrolog -c "SELECT * FROM pg_stat_activity;"
```

### Security Considerations
1. The application runs with security headers enabled
2. File uploads are restricted to images only
3. All API routes are protected against common web vulnerabilities
4. PostgreSQL is configured with appropriate user permissions
5. Database credentials are stored in environment variables, not in code

## 🤝 Contributing

Contributions to HydroLog are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
