const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  const { email, password, rol } = req.body;

  if (!email || !password) {
    return res.status(400).send("⚠️ Correo y contraseña son requeridos");
  }
  if (!rol) {
    return res.status(400).send("⚠️ seleccione un tipo de acceso");
  }

  try {
    const [rows] = await pool.query("SELECT * FROM usuario WHERE correo = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "❌ E-mail incorrecto" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.contrasenia);
    //const validPassword = password === user.contrasenia;

    if (!validPassword) {
      return res.status(401).json({ success: false, message: "❌ Contraseña incorrecta" });
    }

    const [roles] = await pool.query(
      "SELECT Roles_idRoles FROM usuariosroles WHERE Usuarios_idUsuario = ?",
      [user.idUsuario]
    );
    const rolNum = parseInt(rol, 10);
    console.log("Rol que intenta usar para iniciar sesión:", rolNum);

    const idRol = roles.map(r => r.Roles_idRoles); // todos los roles del usuario
    console.log("Roles del usuario en DB:", idRol);
    if (!idRol.includes(rolNum)) {
      return res.status(403).json({ success: false, message: "❌ Rol incorrecto para este usuario" });
    }

    req.session.user = { idUsuario: user.idUsuario, nombre: user.nombre, email: user.correo , perfil: user.filename, idRol: rol};
    res.json({ success: true, message: "✅ Sesión iniciada correctamente",  idRol: rol});

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ success: false, message: "⚠️ Error interno del servidor" });
  }
});


// Ruta de sesión
router.get("/api/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, nombre: req.session.user.nombre , idUsuario: req.session.user.idUsuario, perfil: req.session.user.perfil});
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
