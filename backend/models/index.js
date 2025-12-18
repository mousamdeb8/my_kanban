
const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const User = require("./User")(sequelize, DataTypes);
const Task = require("./Task")(sequelize, DataTypes);

// Associations
User.hasMany(Task, { foreignKey: "user_id", as: "tasks" });
Task.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  sequelize,
  User,
  Task,
};
