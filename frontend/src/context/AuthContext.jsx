import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("hf_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hf_token");
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("hf_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("hf_token");
        localStorage.removeItem("hf_user");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const res = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("hf_token", res.data.access_token);
    const me = { username: res.data.username, full_name: res.data.full_name, role: res.data.role };
    localStorage.setItem("hf_user", JSON.stringify(me));
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("hf_token");
    localStorage.removeItem("hf_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
