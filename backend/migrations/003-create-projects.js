"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("projects", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      color: { type: Sequelize.STRING, defaultValue: "#3b82f6" },
      icon: { type: Sequelize.STRING, defaultValue: "K" },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    // Add project_id to tasks
    await queryInterface.addColumn("tasks", "project_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "projects", key: "id" },
      onDelete: "CASCADE",
    });

    // Add project_id to users
    await queryInterface.addColumn("users", "project_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "projects", key: "id" },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tasks", "project_id");
    await queryInterface.removeColumn("users", "project_id");
    await queryInterface.dropTable("projects");
  },
};