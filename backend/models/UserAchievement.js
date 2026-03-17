// File: backend/models/UserAchievement.js
// Action: NEW FILE

module.exports = (sequelize, DataTypes) => {
  const UserAchievement = sequelize.define("UserAchievement", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    achievement_id: { type: DataTypes.INTEGER, allowNull: false },
    earned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "user_achievements",
    timestamps: false,
  });

  UserAchievement.associate = (models) => {
    UserAchievement.belongsTo(models.AuthUser, { foreignKey: "user_id", as: "user" });
    UserAchievement.belongsTo(models.Achievement, { foreignKey: "achievement_id", as: "achievement" });
  };

  return UserAchievement;
};