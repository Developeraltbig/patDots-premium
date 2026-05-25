import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// Response Interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is expired or unauthorized, force logout
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("persist:root");
      window.location.href = "/login"; // Force redirect to login
    }
    return Promise.reject(error);
  },
);

export default instance;
