module.exports = (sequelize, DataTypes) => {
  const AuthUser = sequelize.define("AuthUser", {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:         { type: DataTypes.STRING,  allowNull: false },
    email:        { type: DataTypes.STRING,  allowNull: false }, // no unique — deactivated users can re-register with same email
    password:     { type: DataTypes.STRING,  allowNull: false },

    // Role stored as plain STRING (not ENUM) so it handles any casing without ALTER errors
    role:         { type: DataTypes.STRING,  defaultValue: "member" },

    avatarColor:  { type: DataTypes.STRING,  defaultValue: "#3b82f6" },
    avatarUrl:    { type: DataTypes.STRING,  allowNull: true },

    // ← THIS WAS THE MISSING FIELD causing "Unknown column 'isActive'"
    isActive:     { type: DataTypes.TINYINT, defaultValue: 1 },

    // Extended profile
    level:        { type: DataTypes.STRING,  allowNull: true },
    department:   { type: DataTypes.STRING,  allowNull: true },
    internType:   { type: DataTypes.STRING,  allowNull: true },
    mentorId:     { type: DataTypes.INTEGER, allowNull: true },
    bio:          { type: DataTypes.TEXT,    allowNull: true },
    jobTitle:        { type: DataTypes.STRING,  allowNull: true },
    employmentType:  { type: DataTypes.STRING,  allowNull: true },
    joinedDate:   { type: DataTypes.DATEONLY, allowNull: true },
    skills:       { type: DataTypes.TEXT,    allowNull: true }, // stored as comma string

    resetToken:       { type: DataTypes.STRING, allowNull: true },
    resetTokenExpiry: { type: DataTypes.BIGINT, allowNull: true },
  }, {
    tableName:  "auth_users",
    timestamps: true,
  });

  AuthUser.associate = (models) => {
    AuthUser.belongsTo(AuthUser, { as: "mentor",  foreignKey: "mentorId" });
    AuthUser.hasMany(AuthUser,   { as: "mentees", foreignKey: "mentorId" });
  };

  return AuthUser;
};