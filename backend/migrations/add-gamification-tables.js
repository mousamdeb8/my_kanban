// File Location: backend/migrations/add-gamification-tables.js
// Action: NEW FILE - Create this file

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table 1: user_points
    await queryInterface.createTable('user_points', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      current_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      longest_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_tasks_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_reviews_given: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Table 2: achievements
    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      icon: {
        type: Sequelize.STRING(50),
      },
      badge_color: {
        type: Sequelize.STRING(20),
      },
      points_reward: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      requirement_type: {
        type: Sequelize.ENUM('tasks_completed', 'streak', 'speed', 'quality', 'reviews', 'early_completion'),
        allowNull: false,
      },
      requirement_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Table 3: user_achievements
    await queryInterface.createTable('user_achievements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      achievement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      earned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add unique constraint
    await queryInterface.addConstraint('user_achievements', {
      fields: ['user_id', 'achievement_id'],
      type: 'unique',
      name: 'unique_user_achievement',
    });

    // Table 4: point_transactions
    await queryInterface.createTable('point_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(255),
      },
      task_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Seed initial achievements
    await queryInterface.bulkInsert('achievements', [
      {
        name: 'First Steps',
        description: 'Complete your first task',
        icon: '🎯',
        badge_color: '#3b82f6',
        points_reward: 50,
        requirement_type: 'tasks_completed',
        requirement_value: 1,
        createdAt: new Date(),
      },
      {
        name: 'Getting Started',
        description: 'Complete 5 tasks',
        icon: '🚀',
        badge_color: '#8b5cf6',
        points_reward: 100,
        requirement_type: 'tasks_completed',
        requirement_value: 5,
        createdAt: new Date(),
      },
      {
        name: 'Task Master',
        description: 'Complete 25 tasks',
        icon: '👑',
        badge_color: '#fbbf24',
        points_reward: 500,
        requirement_type: 'tasks_completed',
        requirement_value: 25,
        createdAt: new Date(),
      },
      {
        name: 'Century Club',
        description: 'Complete 100 tasks',
        icon: '💯',
        badge_color: '#ef4444',
        points_reward: 2000,
        requirement_type: 'tasks_completed',
        requirement_value: 100,
        createdAt: new Date(),
      },
      {
        name: 'On Fire',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        badge_color: '#f59e0b',
        points_reward: 150,
        requirement_type: 'streak',
        requirement_value: 3,
        createdAt: new Date(),
      },
      {
        name: 'Unstoppable',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        badge_color: '#fbbf24',
        points_reward: 500,
        requirement_type: 'streak',
        requirement_value: 7,
        createdAt: new Date(),
      },
      {
        name: 'Legend',
        description: 'Maintain a 30-day streak',
        icon: '🏆',
        badge_color: '#ef4444',
        points_reward: 3000,
        requirement_type: 'streak',
        requirement_value: 30,
        createdAt: new Date(),
      },
      {
        name: 'Helpful Reviewer',
        description: 'Review 10 tasks',
        icon: '🔍',
        badge_color: '#10b981',
        points_reward: 200,
        requirement_type: 'reviews',
        requirement_value: 10,
        createdAt: new Date(),
      },
      {
        name: 'Review Champion',
        description: 'Review 50 tasks',
        icon: '🌟',
        badge_color: '#06b6d4',
        points_reward: 1000,
        requirement_type: 'reviews',
        requirement_value: 50,
        createdAt: new Date(),
      },
      {
        name: 'Speed Demon',
        description: 'Complete 5 tasks early',
        icon: '⚡',
        badge_color: '#8b5cf6',
        points_reward: 300,
        requirement_type: 'early_completion',
        requirement_value: 5,
        createdAt: new Date(),
      },
    ]);

    console.log('✅ Gamification tables created successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('point_transactions');
    await queryInterface.dropTable('user_achievements');
    await queryInterface.dropTable('achievements');
    await queryInterface.dropTable('user_points');
  },
};