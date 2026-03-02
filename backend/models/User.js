module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:       { type: DataTypes.STRING,  allowNull: false },
    email:      { type: DataTypes.STRING,  allowNull: false, unique: true },
    role:       { type: DataTypes.ENUM("admin","member","developer"), defaultValue: "member" },
    department: { type: DataTypes.STRING,  allowNull: true },
    project_id: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName:  "users",
    timestamps: false,
  });
  return User;
};