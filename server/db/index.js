// db/index.js
const sql = require("mssql");

const config = {
  user: "MOHAPP",
  password: "MOHAPP@1234",
  server: "localhost",
  database: "MoHDB_development",
  options: {
    encrypt: false, // set true if using Azure
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

module.exports = {
  sql,
  pool,
  poolConnect,
};
