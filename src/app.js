const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("./config/db");
const session = require("express-session");

const app = express();

// Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, imágenes)
app.use(express.static(path.join(__dirname, "../public")));

app.use(session({
  secret: "clave_super_secreta",
  resave: false,
  saveUninitialized: true
}));

// Ruta de prueba
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("⚠️ Correo y contraseña son requeridos");
  }

  try {
    // Buscar usuario en la BD
    const [rows] = await pool.query("SELECT * FROM usuario WHERE correo = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).send("❌ Usuario no encontrado");
    }

    const user = rows[0];

    // Comparar contraseña ingresada con la guardada en la BD
    //const validPassword = await bcrypt.compare(password, user.contrasenia);
    const validPassword = password === user.contrasenia;

    if (!validPassword) {
      return res.status(401).send("❌ Contraseña incorrecta");
    }

    req.session.user = { id: user.id, nombre: user.nombre, email: user.email };

    // Si es correcto, redirige al dashboard
    res.redirect("/index.html");

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).send("⚠️ Error interno del servidor");
  }
});

// 🔹 Aquí va la ruta para consultar la sesión
app.get("/api/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, nombre: req.session.user.nombre });
  } else {
    res.json({ loggedIn: false });
  }
});

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = app;