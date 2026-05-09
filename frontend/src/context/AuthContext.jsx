import { createContext, useContext, useState } from "react";
import { authApi } from "../api/authApi.js";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (formData, rememberMe = false) => {
    const { data } = await authApi.login(formData);
    const { user, token } = data.data;
    if (rememberMe) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));
    }
    setUser(user);
    toast.success(data.message); // lấy message từ backend
    return user;
  };

  const register = async (formData) => {
    const { data } = await authApi.register(formData);
    const { user, token } = data.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    toast.success(data.message); // lấy message từ backend
    return user;
  };

  const logout = async () => {
    const { data } = await authApi.logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    toast.success(data.message); // "Đăng xuất thành công"
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
