module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define("Project", {
    name:        { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT,   allowNull: true },
    color:       { type: DataTypes.STRING, defaultValue: "#3b82f6" },
    icon:        { type: DataTypes.STRING, defaultValue: "K" },
  }, {
    tableName:  "projects",
    timestamps: true,
  });
  return Project;
};