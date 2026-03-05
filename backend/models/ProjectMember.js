// Junction table: which auth_user has access to which project
module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define("ProjectMember", {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    projectId:  { type: DataTypes.INTEGER, allowNull: false },
    userId:     { type: DataTypes.INTEGER, allowNull: false }, // refer to auth_users.id
    addedBy:    { type: DataTypes.INTEGER, allowNull: true },  // admin who added them 
  }, { tableName: "project_members", timestamps: true });
  return ProjectMember;
};

