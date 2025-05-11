This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

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
   Edit `.env.production` with your production settings.

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

The SQLite database is persisted in a Docker volume. Regular backups are recommended:

1. Backup the database:
   ```bash
   docker exec hydrolog_app_1 tar czf /app/backup.tar.gz /app/data
   docker cp hydrolog_app_1:/app/backup.tar.gz ./backup.tar.gz
   ```

2. Restore from backup:
   ```bash
   docker cp backup.tar.gz hydrolog_app_1:/app/
   docker exec hydrolog_app_1 tar xzf /app/backup.tar.gz
   ```

### Health Monitoring

The application includes a health check endpoint at `/api/health`. Use this to monitor the application's status with your preferred monitoring solution.

### Security Considerations

1. The application runs with security headers enabled
2. File uploads are restricted to images only
3. All API routes are protected against common web vulnerabilities
4. Database is stored in a persistent Docker volume

### Troubleshooting

If you encounter issues:

1. Check the logs: `npm run docker:logs`
2. Verify environment variables are set correctly
3. Ensure all volumes are properly mounted
4. Check the Docker container status: `docker ps`

For additional deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
