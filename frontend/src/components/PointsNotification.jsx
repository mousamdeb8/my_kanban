// File: frontend/src/components/PointsNotification.jsx
// Action: REPLACE EXISTING FILE

import { useEffect, useState } from "react";

export default function PointsNotification({ points, reason, achievement, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const isAchievement = !!achievement;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        background: isAchievement
          ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
          : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: isAchievement
          ? "0 8px 24px rgba(251,191,36,0.4)"
          : "0 8px 24px rgba(59,130,246,0.4)",
        zIndex: 9999,
        animation: "slideInRight 0.3s ease-out, shake 0.5s ease-in-out 0.3s",
        minWidth: 320,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          animation: "bounce 0.6s ease-in-out infinite",
        }}
      >
        {isAchievement ? "🏆" : "⭐"}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {isAchievement ? (
          <>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              🎉 Achievement Unlocked!
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 2,
              }}
            >
              {achievement.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              +{achievement.points_reward} bonus points
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 2,
              }}
            >
              +{points} Points!
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {reason}
            </div>
          </>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.2)";
        }}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}