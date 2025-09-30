// src/routes/registro.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../config/db'); // tu pool MySQL
const bcrypt = require('bcryptjs');

// Carpeta donde se guardarán las fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/perfiles'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Solo imágenes permitidas'));
  }
});

// Ruta POST de registro
router.post('/api/registrar', upload.single('foto'), async (req, res) => {
  try {
        const {
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            telefono,
            ci,
            email,
            password,
            carrera
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !apellidoPaterno || !telefono || !ci || !email || !password || !carrera) {
            return res.json({ success: false, message: "Faltan campos obligatorios" });
        }

        const [existing] = await pool.query(
          "SELECT * FROM usuario WHERE correo = ? OR ci = ?",
          [email, ci]
        );

        if (existing.length > 0) {
          return res.json({ success: false, message: "El correo o CI ya está registrado" });
        }


        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Foto opcional
        const foto = req.file?.filename || null;

        // Insertar en base de datos
        const sql = `
            INSERT INTO usuario 
            (nombre, apellidoPaterno, apellidoMaterno, telefono, ci, correo, contrasenia, filename)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [
            nombre,
            apellidoPaterno,
            apellidoMaterno || null,
            telefono,
            ci,
            email,
            hashedPassword,
            foto
        ]);

        const idUsuario = result.insertId; // ID generado

        // Insertar rol por defecto en rolesusuarios
        const sqlRol = `
          INSERT INTO usuariosroles (Usuarios_idUsuario, Roles_idRoles)
          VALUES (?, ?)
        `;
        const rolPorDefecto = 1; // Cambiar según tu tabla de roles
        await pool.query(sqlRol, [idUsuario, rolPorDefecto]);

        // Insertar en tabla estudiante
        const sqlEstudiante = `
          INSERT INTO estudiante (carrera, Usuario_idUsuario)
          VALUES (?, ?)
        `;
        await pool.query(sqlEstudiante, [ carrera, idUsuario]);

        res.json({ success: true, message: "Usuario registrado correctamente" });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error al registrar usuario" });
    }
});

module.exports = router;
