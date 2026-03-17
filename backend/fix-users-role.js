const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  }
);

async function fixRoleEnum() {
  try {
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'developer', 'member', 'intern') DEFAULT 'member'
    `);
    console.log('✅ Fixed users.role to include intern');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixRoleEnum();