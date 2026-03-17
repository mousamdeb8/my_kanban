// File: frontend/src/components/Leaderboard.jsx
// Action: NEW FILE

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/gamification/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeaders(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div style={{ 
      background: "rgba(255,255,255,0.025)", 
      border: "1px solid rgba(255,255,255,0.08)", 
      borderRadius: 16, 
      padding: 24 
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e6edf3", margin: "0 0 20px" }}>
        🏆 Leaderboard
      </h3>

      {loading ? (
        <p style={{ color: "#8b949e", textAlign: "center" }}>Loading...</p>
      ) : leaders.length === 0 ? (
        <p style={{ color: "#8b949e", textAlign: "center" }}>No data yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {leaders.map((leader, index) => {
            const isMe = leader.user.id === user?.id;
            const rankColor = index === 0 ? "#fbbf24" : index === 1 ? "#9ca3af" : index === 2 ? "#cd7f32" : "#8b949e";
            
            return (
              <div
                key={leader.user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: isMe ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isMe ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 12,
                }}>
                
                <div style={{ 
                  minWidth: 40, 
                  fontSize: 20, 
                  fontWeight: 700, 
                  color: rankColor,
                  textAlign: "center",
                }}>
                  {getMedalEmoji(leader.rank)}
                </div>

                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: leader.user.avatarColor || "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                }}>
                  {leader.user.name?.[0]?.toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>
                    {leader.user.name} {isMe && <span style={{ color: "#3b82f6", fontSize: 12 }}>(You)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#8b949e", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span>Level {leader.level}</span>
                    <span>•</span>
                    <span>🔥 {leader.current_streak} day streak</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6" }}>
                    {leader.points.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: "#8b949e" }}>
                    points
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}