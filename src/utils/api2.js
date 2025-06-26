import axios from "axios";
import config from "../config.json";

const api2 = axios.create({
  baseURL: config.openMRS,
});

api2.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(".otc");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api2;
