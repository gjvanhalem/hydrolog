const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createFixedUser() {
  try {
    // Fixed credentials for testing
    const email = "fixed@example.com";
    const plainPassword = "FixedPass123";
    
    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log("Using test credentials:");
    console.log("Email:", email);
    console.log("Password:", plainPassword);
    
    // Check if user exists and delete if needed
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log("User already exists, deleting...");
      await prisma.userSystem.deleteMany({
        where: { userId: existingUser.id }
      });
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
      console.log("Deleted existing user");
    }
    
    // Create a system
    const system = await prisma.system.create({
      data: {
        name: "Fixed Test System",
        rows: 3,
        positionsPerRow: [4, 4, 4]
      }
    });
    
    console.log("Created system:", system);
    
    // Create a user
    const user = await prisma.user.create({
      data: {
        email,
        name: "Fixed Test User",
        password: hashedPassword
      }
    });
    
    console.log("Created user:", user);
    
    // Create user-system relationship
    const userSystem = await prisma.userSystem.create({
      data: {
        userId: user.id,
        systemId: system.id,
        isActive: true
      }
    });
    
    console.log("Created user-system relationship:", userSystem);
    console.log("Test user created successfully!");
    
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createFixedUser();
