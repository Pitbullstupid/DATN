import { createContext, useContext, useState } from "react";
import { authApi } from "../api/authApi.js";
import { userApi } from "../api/userApi.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const refreshUser = async () => {
    try {
      const { data } = await userApi.getMe();
      const updated = data?.data?.user;
      if (!updated) return;

      setUser(updated);

      // Cập nhật đúng storage đang dùng
      if (localStorage.getItem("token")) {
        localStorage.setItem("user", JSON.stringify(updated));
      } else {
        sessionStorage.setItem("user", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("refreshUser failed:", err);
    }
  };

  const login = async (formData, rememberMe = false) => {
    try {
      const { data } = await authApi.login(formData);
      const { user, token, redirect } = data.data;

      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }

      setUser(user);
      navigate(redirect); // điều hướng theo trạng thái tutor
      
      // Return toàn bộ response để component có thể lấy message
      return {
        user,
        token,
        redirect,
        message: data.message // Trả về message từ API
      };
    } catch (error) {
      // Re-throw error để component catch và xử lý
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await authApi.register(formData);
      const { user, token, redirect } = data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      navigate(redirect); // STUDENT → /dashboard, TUTOR → /tutor/profile/setup
      
      // Return toàn bộ response để component có thể lấy message
      return {
        user,
        token,
        redirect,
        message: data.message // Trả về message từ API
      };
    } catch (error) {
      // Re-throw error để component catch và xử lý
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { data } = await authApi.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setUser(null);
      toast.success(data.message);
      navigate("/"); // về trang chủ sau khi logout
      return data;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
