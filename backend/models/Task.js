module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
      title: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
      status: { type: DataTypes.STRING, defaultValue: "todo" },
      priority: { type: DataTypes.STRING, defaultValue: "Low" },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      dueDate: DataTypes.DATE,
      tag: DataTypes.STRING,
      attachments: { type: DataTypes.JSON, defaultValue: [] },
    },
    {
      tableName: "tasks",
      timestamps: true,         // createdAt & updatedAt
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Task;
};
