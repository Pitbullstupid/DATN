import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
API.interceptors.response.use(
  (res) => res,
  (err) =>
    Promise.reject(new Error(err.response?.data?.message || "Có lỗi xảy ra")),
);

export const createCourse = (data) => API.post("/courses", data);
export const getMyCoursesAsStudent = (params = {}) =>
  API.get("/courses/student", { params });
export const getMyCoursesAsTutor = (params = {}) =>
  API.get("/courses/tutor", { params });
export const getCourseById = (id) => API.get(`/courses/${id}`);
export const startCourse = (id) => API.patch(`/courses/${id}/start`);
export const requestEndCourse = (id) => API.patch(`/courses/${id}/request-end`);
export const cancelCourse = (id) => API.patch(`/courses/${id}/cancel`);
export const updateSession = (id, sid, data) =>
  API.patch(`/courses/${id}/sessions/${sid}`, data);
export const confirmSession = (id, sid) =>
  API.patch(`/courses/${id}/sessions/${sid}/confirm`);
export const reviewCourse = (id, data) =>
  API.post(`/courses/${id}/review`, data);
export const getMessages = (id, params = {}) =>
  API.get(`/courses/${id}/messages`, { params });
export const sendMessage = (id, content) =>
  API.post(`/courses/${id}/messages`, { content });
