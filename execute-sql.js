const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executeSQLScript() {
  const scriptPath = path.join(__dirname, 'prisma', 'add_system_for_user.sql');
  const sql = fs.readFileSync(scriptPath, 'utf-8');

  const commands = sql.split(';').filter(cmd => cmd.trim());

  for (const command of commands) {
    await prisma.$executeRawUnsafe(command);
  }

  console.log('SQL script executed successfully');

  const systems = await prisma.system.findMany();
  const user = await prisma.user.findUnique({ where: { id: 1 } });

  console.log('Systems:', systems);
  console.log('User 1:', user);

  await prisma.$disconnect();
}

executeSQLScript().catch(error => {
  console.error('Error executing SQL script:', error);
  process.exit(1);
});
