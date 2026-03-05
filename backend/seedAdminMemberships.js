// Call this function after sequelize.sync in server.js
// It ensures all admins are members of all projects

const seedAdminMemberships = async () => {
  try {
    const { AuthUser, Project, ProjectMember } = require("./models");
    
    const admins   = await AuthUser.findAll({ where: { role: "admin" } });
    const projects = await Project.findAll({ attributes: ["id"] });

    for (const admin of admins) {
      for (const project of projects) {
        await ProjectMember.findOrCreate({
          where:    { projectId: project.id, userId: admin.id },
          defaults: { projectId: project.id, userId: admin.id, addedBy: admin.id },
        });
      }
    }
    console.log(`✅ Admin memberships seeded: ${admins.length} admin(s), ${projects.length} project(s)`);
  } catch (err) {
    console.error("❌ seedAdminMemberships error:", err.message);
  }
};

module.exports = seedAdminMemberships;