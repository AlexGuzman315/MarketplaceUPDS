const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("./config/db");
const session = require("express-session");

const app = express();

app.use(session({
  secret: "clave_super_secreta",
  resave: false,
  saveUninitialized: true
}));

// Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, imágenes)
app.use(express.static(path.join(__dirname, "../public")));

const categoriasRouter = require("./routes/categorias");
const inicioSesionRouter = require("./routes/InicioSesion");
const gestionArticuloRouter = require("./routes/GestionArticulo");
const registrarseRouter = require("./routes/registrar");
const rolesRouter = require("./routes/roles");

app.use("/api/categorias", categoriasRouter);
app.use("/", inicioSesionRouter); 
app.use("/api/articulos", gestionArticuloRouter);
const chatRouter = require("./routes/chats");
app.use("/api/chats", chatRouter);
app.use("/", registrarseRouter);
app.use("/api/roles", rolesRouter);

// Ruta de inicio
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

// Manejo de errores internos
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error interno del servidor");
});

module.exports = app;
