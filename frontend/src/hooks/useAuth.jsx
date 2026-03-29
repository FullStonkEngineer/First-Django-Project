import { useState, useEffect, createContext, useContext } from "react";
import api from "../lib/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";

// Context for global auth state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token && !isTokenExpired(token)) {
        setUser(jwtDecode(token));
      } else if (!(await refreshToken())) {
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const isTokenExpired = (token) => {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  };

  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (!refresh) return false;

    try {
      const res = await api.post("/api/token/refresh/", { refresh });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      setUser(jwtDecode(res.data.access));
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const login = async (username, password) => {
    const res = await api.post("/api/token/", { username, password });
    localStorage.setItem(ACCESS_TOKEN, res.data.access);
    localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
    setUser(jwtDecode(res.data.access));
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setUser(null);
  };

  const register = async (username, password) => {
    await api.post("/api/user/register/", { username, password });
  };

  return { user, loading, login, logout, register };
}
