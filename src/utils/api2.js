import axios from "axios";
import config from "../config.json";

const api2 = axios.create({
  baseURL: config.openMRS,
});

export default api2;
