const { DataTypes } = require("sequelize");
const sequelize = require("../database");

// Load models
const User    = require("./User")(sequelize, DataTypes);
const Task    = require("./Task")(sequelize, DataTypes);
const Project = require("./Project")(sequelize, DataTypes);

// ── Associations ──

// Project → Tasks (one project has many tasks)
Project.hasMany(Task, { foreignKey: "project_id", as: "tasks", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "project_id", as: "project" });

// Project → Users (one project has many members)
Project.hasMany(User, { foreignKey: "project_id", as: "members", onDelete: "CASCADE" });
User.belongsTo(Project, { foreignKey: "project_id", as: "project" });

// User → Tasks
User.hasMany(Task, { foreignKey: "user_id", as: "tasks" });
Task.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = { sequelize, User, Task, Project };