import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function executeSQLScript() {
  const scriptPath = path.join(__dirname, '../../prisma/add_system_for_user.sql');
  const sql = fs.readFileSync(scriptPath, 'utf-8');

  const commands = sql.split(';').filter(cmd => cmd.trim());

  for (const command of commands) {
    console.log('Executing SQL command:', command); // Log each command
    await prisma.$executeRawUnsafe(command);
  }
}
