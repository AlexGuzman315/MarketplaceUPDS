const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const userId = req.session?.user?.idUsuario; // 👈 del login
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const [chats] = await pool.query(`
      SELECT c.idChat, 
             u.idUsuario, 
             u.nombre, 
             u.apellidoPaterno, 
             m.contenido AS ultimoMensaje,
             m.fechaEnvio
      FROM chat c
      JOIN usuario u 
        ON (u.idUsuario = c.Usuarios_idUsuarioEmisor OR u.idUsuario = c.Usuarios_idUsuarioReceptor)
       AND u.idUsuario != ?
      LEFT JOIN mensaje m 
        ON m.idmensaje = (
            SELECT idmensaje 
            FROM mensaje 
            WHERE idChat = c.idChat 
            ORDER BY fechaEnvio DESC 
            LIMIT 1
        )
      WHERE c.Usuarios_idUsuarioEmisor = ? OR c.Usuarios_idUsuarioReceptor = ?
      ORDER BY m.fechaEnvio DESC
    `, [userId, userId, userId]);

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener chats" });
  }
});

router.get("/mensajes", async (req, res) => {
  const userIdLogueado = req.session?.user?.idUsuario;
  const { chatId } = req.query;

  if (!chatId) return res.status(400).json({ error: "Falta chatId" });

  try {
    // Consulta para traer todos los mensajes del chat con info del usuario
    const [rows] = await pool.query(
      `SELECT 
         m.idMensaje,
         m.contenido,
         m.fechaEnvio,
         m.Usuarios_idUsuario AS idUsuario,
         u.nombre AS emisor
       FROM Mensaje m
       JOIN Usuario u ON m.Usuarios_idUsuario = u.idUsuario
       WHERE m.Chat_idChat = ?
       ORDER BY m.fechaEnvio ASC`,
      [chatId]
    );

    // Agregamos userId a cada row
    const mensajesConUsuario = rows.map(m => ({
      ...m,
      userIdLogueado // este es el id del usuario logueado
    }));

    res.json(mensajesConUsuario);
  } catch (err) {
    console.error("Error al cargar mensajes:", err);
    res.status(500).json({ error: "Error al cargar mensajes" });
  }
});

// Crear o buscar chat entre comprador y vendedor
router.post("/", async (req, res) => {
  const { compradorId, vendedorId } = req.body;

  if (!compradorId || !vendedorId) {
    return res.status(400).json({ error: "Faltan IDs de usuario" });
  }

  try {
    // Revisar si ya existe un chat
    const [chat] = await pool.query(
      "SELECT idChat FROM chat WHERE Usuarios_idUsuarioEmisor = ? AND Usuarios_idUsuarioReceptor = ?",
      [compradorId, vendedorId]
    );

    let chatId;

    if (chat.length > 0) {
      chatId = chat[0].idChat; // ⬅ corregido
    } else {
      const [result] = await pool.query(
        "INSERT INTO chat (FechaInicio, Usuarios_idUsuarioEmisor, Usuarios_idUsuarioReceptor) VALUES (NOW(), ?, ?)",
        [compradorId, vendedorId]
      );
      chatId = result.insertId;
    }

    res.json({ chatId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando chat" });
  }
});

module.exports = router;
