const { DataTypes } = require("sequelize");
const sequelize     = require("../database");

const User          = require("./User")(sequelize, DataTypes);
const Task          = require("./Task")(sequelize, DataTypes);
const AuthUser      = require("./AuthUser")(sequelize, DataTypes);
const Notification  = require("./Notification")(sequelize, DataTypes);
const Project       = require("./Project")(sequelize, DataTypes);
const ProjectMember = require("./ProjectMember")(sequelize, DataTypes);

// ── Task <-> User ──
User.hasMany(Task,   { foreignKey: "user_id", as: "tasks" });
Task.belongsTo(User, { foreignKey: "user_id", as: "user"  });

// ── Project <-> Task (for taskCount in GET /projects) ──
Project.hasMany(Task, { foreignKey: "project_id", as: "tasks" });
Task.belongsTo(Project, { foreignKey: "project_id", as: "project" });

// ── Project <-> User (for memberCount via users table) ──
Project.hasMany(User, { foreignKey: "project_id", as: "teamMembers" });
User.belongsTo(Project, { foreignKey: "project_id", as: "project" });

// ── Project <-> ProjectMember (auth_users junction) ──
Project.hasMany(ProjectMember, { foreignKey: "projectId", as: "members" });
ProjectMember.belongsTo(Project, { foreignKey: "projectId" });

// ── ProjectMember <-> AuthUser ──
ProjectMember.belongsTo(AuthUser, { foreignKey: "userId", as: "authUser" });
AuthUser.hasMany(ProjectMember,   { foreignKey: "userId", as: "projectMemberships" });

// ── AuthUser self-ref (mentor) ──
AuthUser.belongsTo(AuthUser, { as: "mentor",  foreignKey: "mentorId" });
AuthUser.hasMany(AuthUser,   { as: "mentees", foreignKey: "mentorId" });

module.exports = { sequelize, User, Task, AuthUser, Notification, Project, ProjectMember };