module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    userId:    { type: DataTypes.INTEGER, allowNull: false },
    type:      { type: DataTypes.STRING,  defaultValue: "info" },
    message:   { type: DataTypes.STRING,  allowNull: false },
    sub:       { type: DataTypes.STRING,  allowNull: true },
    taskId:    { type: DataTypes.INTEGER, allowNull: true },   // for click-to-navigate
    projectId: { type: DataTypes.INTEGER, allowNull: true },   // for click-to-navigate
    isRead:    { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: "notifications", timestamps: true });
  return Notification;
};