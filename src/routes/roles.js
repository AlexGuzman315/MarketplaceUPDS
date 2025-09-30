const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Ruta para traer categorías
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT idRoles, nombre FROM roles");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener roles:", err);
    res.status(500).json({ error: "Error al obtener roles" });
  }
});

module.exports = router;
