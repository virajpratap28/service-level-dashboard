import React, { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sl_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("sl_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await loginApi(username, password);
    localStorage.setItem("sl_token", data.token);
    localStorage.setItem("sl_user", JSON.stringify({ username: data.username, role: data.role }));
    setUser({ username: data.username, role: data.role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("sl_token");
    localStorage.removeItem("sl_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
