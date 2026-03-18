// File: frontend/src/pages/Achievements.jsx
// Action: NEW FILE

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AchievementBadge from "../components/AchievementBadge";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Achievements() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/gamification/achievements`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/gamification/my-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const achievementsData = await achievementsRes.json();
      const statsData = await statsRes.json();

      setAchievements(achievementsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.earned);
  const lockedAchievements = achievements.filter((a) => !a.earned);

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          🏆 Achievements
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {earnedAchievements.length} of {achievements.length} unlocked
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.points}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.level}
              </div>
              <div className="text-xs text-gray-500 mt-1">Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.current_streak}
              </div>
              <div className="text-xs text-gray-500 mt-1">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.total_tasks_completed}
              </div>
              <div className="text-xs text-gray-500 mt-1">Tasks Done</div>
            </div>
          </div>
        </div>
      )}

      {/* Earned Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          ✨ Unlocked ({earnedAchievements.length})
        </h2>
        <div className="grid grid-cols-6 gap-4">
          {earnedAchievements.length === 0 ? (
            <p className="col-span-6 text-sm text-gray-400 italic">
              No achievements unlocked yet. Complete tasks to earn badges!
            </p>
          ) : (
            earnedAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                earned={true}
                earnedAt={achievement.earned_at}
              />
            ))
          )}
        </div>
      </div>

      {/* Locked Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          🔒 Locked ({lockedAchievements.length})
        </h2>
        <div className="grid grid-cols-6 gap-4">
          {lockedAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              earned={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}