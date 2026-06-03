import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ email: payload.sub });
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    const { accessToken } = response.data;
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    setUser({ email: payload.sub });
    return response.data;
  };

  const register = async (email, password) => {
    const response = await api.post("/api/auth/register", { email, password });
    const { accessToken } = response.data;
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    setUser({ email: payload.sub });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
