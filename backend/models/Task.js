module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
      title:         { type: DataTypes.STRING,  allowNull: false },
      description:   DataTypes.TEXT,
      status:        { type: DataTypes.STRING,  defaultValue: "todo" },
      priority:      { type: DataTypes.STRING,  defaultValue: "Medium" },
      user_id:       { type: DataTypes.INTEGER, allowNull: true },
      assignedById:  { type: DataTypes.INTEGER, allowNull: true }, // auth_users.id of who assigned this
      dueDate:       DataTypes.DATEONLY,
      tag:           DataTypes.STRING,
      taskType:      { type: DataTypes.STRING,  defaultValue: "task" },
      project_id:    { type: DataTypes.INTEGER, allowNull: true },
      attachments:   { type: DataTypes.JSON,    defaultValue: [] },
      reviews:       { type: DataTypes.TEXT,    defaultValue: null },
      reviewVerdict: { type: DataTypes.STRING,  defaultValue: null },
    },
    {
      tableName:  "tasks",
      timestamps: true,
      createdAt:  "createdAt",
      updatedAt:  "updatedAt",
    }
  );
  return Task;
};