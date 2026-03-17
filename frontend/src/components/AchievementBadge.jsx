// File: frontend/src/components/AchievementBadge.jsx
// Action: REPLACE EXISTING FILE (FIXED)

import { useState } from "react";

export default function AchievementBadge({ achievement, earned, earnedAt }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onMouseEnter={() => {
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
      }}
      style={{
        position: "relative",
        width: 80,
        height: 80,
        borderRadius: 16,
        background: earned ? achievement.badge_color + "22" : "rgba(255,255,255,0.03)",
        border: earned ? `2px solid ${achievement.badge_color}` : "2px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        opacity: earned ? 1 : 0.4,
        transform: showTooltip ? "scale(1.05)" : "scale(1)",
      }}>
      
      {/* Badge Icon */}
      <div style={{ fontSize: 32 }}>
        {achievement.icon}
      </div>
      
      {/* Points */}
      {earned && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: achievement.badge_color,
          marginTop: 4,
        }}>
          +{achievement.points_reward}
        </div>
      )}

      {/* Lock Icon if not earned */}
      {!earned && (
        <div style={{
          position: "absolute",
          bottom: 6,
          right: 6,
          fontSize: 14,
          opacity: 0.5,
        }}>
          🔒
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: 8,
          padding: "8px 12px",
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          width: 180,
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3", marginBottom: 4 }}>
            {achievement.name}
          </div>
          <div style={{ fontSize: 10, color: "#8b949e", marginBottom: 4 }}>
            {achievement.description}
          </div>
          {earned && earnedAt && (
            <div style={{ fontSize: 9, color: "#3b82f6", marginTop: 4 }}>
              ✓ Earned {new Date(earnedAt).toLocaleDateString()}
            </div>
          )}
          {!earned && (
            <div style={{ fontSize: 9, color: "#6e7681" }}>
              {achievement.requirement_type.replace('_', ' ')}: {achievement.requirement_value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}