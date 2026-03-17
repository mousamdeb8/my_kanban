// File: backend/services/gamificationService.js
// Action: NEW FILE
// This service AUTOMATICALLY assigns points when tasks are completed

const { UserPoint, Achievement, UserAchievement, PointTransaction } = require("../models");
const { Op } = require("sequelize");

class GamificationService {
  
  // AUTO-CALLED when task is completed
  static async awardTaskPoints(userId, taskId, priority, isEarly = false) {
    let points = 10; // Base points
    
    if (priority === "High") points += 15;
    else if (priority === "Medium") points += 5;
    
    if (isEarly) points += 15;
    
    await this.addPoints(userId, points, `Completed task`, taskId);
    await this.checkAchievements(userId);
    await this.updateStreak(userId);
    
    return points;
  }
  
  // AUTO-CALLED when user reviews a task
  static async awardReviewPoints(userId, taskId) {
    const points = 5;
    await this.addPoints(userId, points, `Reviewed task`, taskId);
    
    const userPoint = await UserPoint.findOne({ where: { user_id: userId } });
    if (userPoint) {
      await userPoint.update({ 
        total_reviews_given: userPoint.total_reviews_given + 1 
      });
    }
    
    await this.checkAchievements(userId);
    return points;
  }
  
  static async addPoints(userId, points, reason, taskId = null) {
    let userPoint = await UserPoint.findOne({ where: { user_id: userId } });
    if (!userPoint) {
      userPoint = await UserPoint.create({ user_id: userId });
    }
    
    const newPoints = userPoint.points + points;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    await userPoint.update({ 
      points: newPoints,
      level: newLevel,
      total_tasks_completed: taskId ? userPoint.total_tasks_completed + 1 : userPoint.total_tasks_completed,
    });
    
    await PointTransaction.create({
      user_id: userId,
      points,
      reason,
      task_id: taskId,
    });
    
    console.log(`✅ ${points} points → user ${userId}: ${reason}`);
  }
  
  static async updateStreak(userId) {
    const userPoint = await UserPoint.findOne({ where: { user_id: userId } });
    if (!userPoint) return;
    
    const today = new Date().toDateString();
    const lastCompletion = await PointTransaction.findOne({
      where: { user_id: userId, reason: { [Op.like]: 'Completed%' } },
      order: [["createdAt", "DESC"]],
      offset: 1,
    });
    
    if (!lastCompletion) {
      await userPoint.update({ current_streak: 1, longest_streak: 1 });
      return;
    }
    
    const lastDate = new Date(lastCompletion.createdAt).toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastDate === yesterdayStr || lastDate === today) {
      const newStreak = userPoint.current_streak + 1;
      await userPoint.update({ 
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, userPoint.longest_streak),
      });
    } else {
      await userPoint.update({ current_streak: 1 });
    }
  }
  
  static async checkAchievements(userId) {
    const userPoint = await UserPoint.findOne({ where: { user_id: userId } });
    if (!userPoint) return;
    
    const allAchievements = await Achievement.findAll();
    const userAchievements = await UserAchievement.findAll({ 
      where: { user_id: userId },
      attributes: ["achievement_id"],
    });
    const earnedIds = userAchievements.map(ua => ua.achievement_id);
    
    for (const achievement of allAchievements) {
      if (earnedIds.includes(achievement.id)) continue;
      
      let earned = false;
      
      switch (achievement.requirement_type) {
        case "tasks_completed":
          earned = userPoint.total_tasks_completed >= achievement.requirement_value;
          break;
        case "streak":
          earned = userPoint.current_streak >= achievement.requirement_value;
          break;
        case "reviews":
          earned = userPoint.total_reviews_given >= achievement.requirement_value;
          break;
      }
      
      if (earned) {
        await UserAchievement.create({
          user_id: userId,
          achievement_id: achievement.id,
        });
        
        await this.addPoints(userId, achievement.points_reward, `Achievement: ${achievement.name}`);
        
        console.log(`🏆 User ${userId} earned: ${achievement.name}`);
      }
    }
  }
}

module.exports = GamificationService;