import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const API = "http://localhost:8000";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("token") || sessionStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (r.ok) return r.json();
        // Token invalid/expired — silently clear, no toast
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setToken(null);
        return null;
      })
      .then(u => { setUser(u || null); setLoading(false); })
      .catch(() => {
        // Network error — don't logout, just stop loading (might be offline)
        setLoading(false);
      });
  }, [token]);

  const login = (tok, userData, remember = true) => {
    if (remember) localStorage.setItem("token", tok);
    else          sessionStorage.setItem("token", tok);
    setToken(tok);
    setUser(userData);
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