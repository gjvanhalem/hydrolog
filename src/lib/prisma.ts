import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

// Define log levels properly for TypeScript
type LogLevel = 'query' | 'info' | 'warn' | 'error';

// PostgreSQL optimization options
const prismaClientOptions: Prisma.PrismaClientOptions = {
  // Configure connection pooling for PostgreSQL
  // These values can be adjusted based on your application's needs
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as LogLevel[]
    : ['error'] as LogLevel[],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
};

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle Prisma Client connection issues
(prisma as any).$on('error', (e: any) => {
  logger.error(`Prisma Client error: ${e.message}`);
});

/**
 * Executes a PostgreSQL script file
 * This function can be used to run initialization scripts or custom SQL operations
 * @param scriptPath Path to the SQL script file to execute
 */
export async function executeSQLScript(scriptPath?: string) {
  try {
    const scriptToExecute = scriptPath || path.join(process.cwd(), 'prisma/add_system_for_user.sql');
    
    logger.info(`Executing PostgreSQL script: ${scriptToExecute}`);
    
    // For PostgreSQL, we can execute the whole script at once using the Prisma query interface
    const sql = fs.readFileSync(scriptToExecute, 'utf-8');
    
    // Split the SQL commands by semicolon and filter out empty commands
    const commands = sql
      .split(';')
      .map((cmd: string) => cmd.trim())
      .filter((cmd: string) => cmd.length > 0);
    
    // Execute each command individually
    for (const command of commands) {
      logger.debug(`Executing PostgreSQL command: ${command}`);
      await prisma.$executeRawUnsafe(command);
    }
    
    logger.info('PostgreSQL script execution completed successfully');
  } catch (error) {
    logger.error(`Error executing PostgreSQL script: ${(error as Error).message}`);
    throw error;
  }
}
