const axios = require("axios");
const https = require("https");

require("dotenv").config();

const isDev = process.env.NODE_ENV === "development";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_OPENMRS_URL}/openmrs/ws/rest/v1`,
  httpsAgent: isDev
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined,
});

api.interceptors.request.use(
  (config) => {
    const credentials = Buffer.from(
      `${process.env.REACT_APP_OPENMRS_USER}:${process.env.REACT_APP_OPENMRS_PASS}`
    ).toString("base64");
    config.headers.Authorization = `Basic ${credentials}`;
    return config;
  },
  (error) => Promise.reject(error)
);

module.exports = api;
