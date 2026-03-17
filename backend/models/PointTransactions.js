// File: backend/models/PointTransaction.js
// Action: NEW FILE

module.exports = (sequelize, DataTypes) => {
  const PointTransaction = sequelize.define("PointTransaction", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(255) },
    task_id: { type: DataTypes.INTEGER },
  }, {
    tableName: "point_transactions",
    timestamps: true,
    updatedAt: false,
  });

  PointTransaction.associate = (models) => {
    PointTransaction.belongsTo(models.AuthUser, { foreignKey: "user_id", as: "user" });
    PointTransaction.belongsTo(models.Task, { foreignKey: "task_id", as: "task" });
  };

  return PointTransaction;
};