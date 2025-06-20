import axios from "axios";
import config from "../config.json";

const api = axios.create({
  baseURL: `${config.bakendURL}/api`,
});

api.interceptors.request.use(
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



export default api;
