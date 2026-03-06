import { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("token") || sessionStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const u = await res.json();
          setUser(u);
          setLoading(false);
          retryCount.current = 0;
          return;
        }

        // 401 = token truly invalid/expired → logout
        if (res.status === 401) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Any other error (502, 503, 504 = backend waking up) → retry
        throw new Error("Backend not ready: " + res.status);

      } catch (err) {
        // Network error or backend sleeping — retry up to 5 times
        if (retryCount.current < 5) {
          retryCount.current += 1;
          console.log("Backend waking up... retry " + retryCount.current + "/5");
          setTimeout(verifyToken, 3000 * retryCount.current);
        } else {
          // After 5 retries — keep user logged in, just stop loading
          console.warn("Backend unreachable after retries — keeping session");
          setLoading(false);
        }
      }
    };

    verifyToken();
  }, [token]);

  const login = (tok, userData, remember = true) => {
    if (remember) localStorage.setItem("token", tok);
    else          sessionStorage.setItem("token", tok);
    setToken(tok);
    setUser(userData);
    retryCount.current = 0;
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => setUser(prev => prev ? { ...prev, ...updated } : prev);

  const can = (action) => {
    if (!user) return false;
    const r = user.role;
    const perms = {
      createProject:  ["admin"],
      deleteProject:  ["admin"],
      editProject:    ["admin"],
      createTask:     ["admin","developer","intern"],
      editTask:       ["admin","developer","intern"],
      deleteTask:     ["admin"],
      updateStatus:   ["admin","developer","member","intern"],
      manageMembers:  ["admin"],
      viewSettings:   ["admin","developer","member","intern"],
    };
    return perms[action]?.includes(r) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, can, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);