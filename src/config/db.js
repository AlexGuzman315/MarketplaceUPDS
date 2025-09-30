const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost", // prueba esto en vez de localhost
  user: "root",
  password: "123",
  database: "marketplaceupds",
  port: 3306,        // o 3307 si tu instalación lo usa
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
