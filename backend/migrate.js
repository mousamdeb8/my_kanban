// Run once to migrate old data: node migrate.js
const { sequelize, Project, Task, User } = require("./models");

async function migrate() {
  try {
    console.log("Syncing database...");
    await sequelize.sync({ alter: true });
    console.log("DB synced ✓");

    // Create default project for old data
    let project = await Project.findOne({ where: { name: "My Kanban" } });
    if (!project) {
      project = await Project.create({
        name: "My Kanban",
        description: "Migrated from original kanban board",
        color: "#3b82f6",
        icon: "K",
      });
      console.log("Created 'My Kanban' project, id:", project.id);
    } else {
      console.log("Project already exists, id:", project.id);
    }

    const [taskResult] = await sequelize.query(
      `UPDATE tasks SET project_id = ${project.id} WHERE project_id IS NULL`
    );
    console.log("Tasks migrated:", taskResult.affectedRows ?? "done");

    const [userResult] = await sequelize.query(
      `UPDATE users SET project_id = ${project.id} WHERE project_id IS NULL`
    );
    console.log("Users migrated:", userResult.affectedRows ?? "done");

    console.log("\n✅ Done! Visit /projects to see your data.");
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}

migrate();