const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "defaultdb",
  process.env.DB_USER || "avnadmin",
  process.env.DB_PASS || process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || "localhost",
    port:    parseInt(process.env.DB_PORT || "3306"),
    dialect: "mysql",
    logging: false,
    dialectOptions: process.env.DB_SSL === "true"
      ? {
          ssl: {
            rejectUnauthorized: true,
          },
        }
      : {},
    pool: {
      max:     5,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },
  }
);

module.exports = sequelize;