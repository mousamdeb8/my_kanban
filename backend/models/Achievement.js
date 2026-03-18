// File: backend/models/Achievement.js
// Action: NEW FILE

module.exports = (sequelize, DataTypes) => {
  const Achievement = sequelize.define("Achievement", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT },
    icon: { type: DataTypes.STRING(50) },
    badge_color: { type: DataTypes.STRING(20) },
    points_reward: { type: DataTypes.INTEGER, defaultValue: 0 },
    requirement_type: { 
      type: DataTypes.ENUM('tasks_completed', 'streak', 'speed', 'quality', 'reviews', 'early_completion'),
      allowNull: false 
    },
    requirement_value: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: "achievements",
    timestamps: true,
    updatedAt: false,
  });

  return Achievement;
};