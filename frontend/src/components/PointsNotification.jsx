// File: frontend/src/components/PointsNotification.jsx
// Action: NEW FILE

import { useEffect, useState } from "react";

export default function PointsNotification({ points, reason, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 80,
      right: 20,
      background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      border: "2px solid rgba(255,255,255,0.2)",
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
      zIndex: 9999,
      animation: "slideInRight 0.3s ease-out",
    }}>
      {/* Star Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
      }}>
        ⭐
      </div>

      {/* Content */}
      <div>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 2,
        }}>
          +{points} Points!
        </div>
        <div style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.8)",
        }}>
          {reason}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          marginLeft: 8,
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
        }}>
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
      `}</style>
    </div>
  );
}