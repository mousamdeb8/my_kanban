// File: frontend/src/pages/Profile.jsx
// Action: NEW FILE

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Profile() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/gamification/my-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
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

  const pointsToNextLevel = stats ? (stats.level * 100) - stats.points : 0;
  const levelProgress = stats ? ((stats.points % 100) / 100) * 100 : 0;

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          👤 My Profile
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Your stats and progress</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
            style={{ background: user?.avatarColor || "#6366f1" }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-blue-100 text-sm">{user?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                {user?.role?.toUpperCase()}
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                Level {stats?.level || 1}
              </div>
            </div>
          </div>

          {/* Points */}
          <div className="text-right">
            <div className="text-5xl font-black">{stats?.points || 0}</div>
            <div className="text-sm text-blue-100">Total Points</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Level {stats?.level || 1}</span>
            <span>{pointsToNextLevel} points to Level {(stats?.level || 1) + 1}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {stats?.total_tasks_completed || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">Tasks Completed</div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {stats?.total_reviews_given || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">Reviews Given</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {stats?.achievements?.length || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">Achievements</div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🔥</div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.current_streak || 0}
              </div>
              <div className="text-sm text-gray-500">Current Streak</div>
              <div className="text-xs text-gray-400 mt-1">
                Complete tasks daily to maintain your streak!
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">⚡</div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.longest_streak || 0}
              </div>
              <div className="text-sm text-gray-500">Longest Streak</div>
              <div className="text-xs text-gray-400 mt-1">
                Your personal best!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {stats?.achievements && stats.achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            🌟 Recent Achievements
          </h2>
          <div className="space-y-3">
            {stats.achievements.slice(0, 5).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {achievement.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {achievement.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">
                    +{achievement.points_reward}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(achievement.earned_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Points */}
      {stats?.recent_transactions && stats.recent_transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            💰 Recent Activity
          </h2>
          <div className="space-y-2">
            {stats.recent_transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {transaction.reason}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                  <div className="font-bold text-green-600">
                    +{transaction.points}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}