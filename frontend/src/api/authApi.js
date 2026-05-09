import axiosInstance from "./axiosInstance.js";

export const authApi = {
  register: (data) => axiosInstance.post("/auth/register", data),
  login: (data) => axiosInstance.post("/auth/login", data),
  logout: () => axiosInstance.post("/auth/logout"),
};