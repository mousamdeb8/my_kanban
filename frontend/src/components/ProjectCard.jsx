import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * ProjectCard Component
 * Shows project info with delete button for admins
 */
export default function ProjectCard({ project, user, onDelete }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete project");
      }

      toast.success(`Project "${data.projectName}" deleted successfully`);
      
      // Call parent callback to refresh project list
      if (onDelete) {
        onDelete(project.id);
      }

    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = () => {
    if (!showDeleteConfirm) {
      navigate(`/projects/${project.id}/board`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="project-card relative bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer border border-gray-700"
    >
      {/* Project Icon/Avatar */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: project.color || "#6366f1" }}
          >
            {project.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {project.name}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-1">
              {project.description || "No description"}
            </p>
          </div>
        </div>

        {/* Delete Button - Admin Only */}
        {isAdmin && (
          <button
            onClick={handleDeleteClick}
            className="text-gray-400 hover:text-red-500 transition p-2"
            title="Delete project"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress & Stats */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Progress</span>
            <span className="text-white font-medium">
              {project.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <span>📋</span>
            <span>{project.taskCount || 0} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{project.memberCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-gray-900 bg-opacity-95 rounded-lg flex flex-col items-center justify-center p-6 z-10"
        >
          <div className="text-center space-y-4">
            <div className="text-red-500 text-4xl">⚠️</div>
            <h4 className="text-white font-semibold text-lg">
              Delete Project?
            </h4>
            <p className="text-gray-300 text-sm">
              This will permanently delete:
              <br />
              <strong>"{project.name}"</strong>
              <br />
              <span className="text-gray-400">
                All tasks, members, and data will be lost!
              </span>
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Deleting...
                  </>
                ) : (
                  <>🗑️ Delete Forever</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}