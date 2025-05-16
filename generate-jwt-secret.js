// Generate a secure JWT secret
const crypto = require('crypto');

const generateJwtSecret = () => {
  const secret = crypto.randomBytes(32).toString('hex');
  
  console.log('\n=== GENERATED JWT SECRET ===');
  console.log(secret);
  console.log('\nAdd this to your .env file as:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('\nOr use it directly in your docker-compose command:');
  console.log(`JWT_SECRET=${secret} docker-compose up -d`);
  console.log('===============================\n');
};

generateJwtSecret();
