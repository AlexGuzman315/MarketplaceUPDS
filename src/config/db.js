const mysql = require("mysql2/promise");

// Configuración de la base de datos
const pool = mysql.createPool({
  host: "localhost",   // Cambia si tu BD está en otro servidor
  user: "root",        // Tu usuario de MySQL
  password: "123",        // Tu contraseña
  database: "marketplaceupds", // Nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
