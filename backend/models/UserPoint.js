// File Location: backend/models/UserPoint.js
// Action: NEW FILE - Create this file

module.exports = (sequelize, DataTypes) => {
  const UserPoint = sequelize.define("UserPoint", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    current_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    longest_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_tasks_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_reviews_given: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: "user_points",
    timestamps: true,
  });

  UserPoint.associate = (models) => {
    UserPoint.belongsTo(models.AuthUser, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return UserPoint;
};