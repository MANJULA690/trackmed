import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/services";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("tm_token");
    const saved = localStorage.getItem("tm_user");
    if (token && saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("tm_token", data.token);
    localStorage.setItem("tm_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("tm_token");
    localStorage.removeItem("tm_user");
    setUser(null);
    toast.success("Logged out successfully");
  }, []);

  const value = { user, loading, login, logout, isAdmin: user?.role === "admin" };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
