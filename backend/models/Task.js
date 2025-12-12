const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Task = sequelize.define(
  "Task",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "todo",
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: "Low",
    },
    assignee: {
      type: DataTypes.STRING,
      defaultValue: "Unassigned",
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    tableName: "tasks",
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Task;
