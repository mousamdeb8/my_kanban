const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("kanban_db", "root", "mousamdeb8", {
  host: "localhost",
  dialect: "mysql",
  logging: true,
});

module.exports = sequelize;
