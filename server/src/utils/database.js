const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function disconnect() {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}

module.exports = {
  prisma,
  testConnection,
  disconnect
}; 