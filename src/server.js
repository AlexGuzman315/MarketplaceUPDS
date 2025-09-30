const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const pool = require("./config/db");

const PORT = 3000;
const server = http.createServer(app);
const io = new Server(server);

const usuariosConectados = new Map();

// Manejo de conexiones
io.on("connection", (socket) => {

  socket.on("registrarUsuario", (userId) => {
    usuariosConectados.set(userId, socket.id);
    console.log(`Usuario ${userId} conectado`);
  });

  socket.on("verificarConexion", (userId, callback) => {
    // callback se llama para enviar la respuesta al cliente
    callback(usuariosConectados.has(userId));
  });

  socket.on("disconnect", () => {
    for (const [userId, idSocket] of usuariosConectados.entries()) {
      if (idSocket === socket.id) {
        usuariosConectados.delete(userId);
        console.log(`Usuario ${userId} desconectado`);
        break;
      }
    }
  });

  // Unirse a un chat específico
  socket.on("unirseChat", ({ chatId }) => {
    socket.join(`chat_${chatId}`);
  });

  // Enviar mensaje
  socket.on("chatMessage", async ({ chatId, texto, userId }) => {
    try {
      const [result] = await pool.query(
        "INSERT INTO Mensaje (contenido, fechaEnvio, Chat_idChat, Usuarios_idUsuario) VALUES (?, NOW(), ?, ?)",
        [texto, chatId, userId]
      );

      const mensaje = {
        idMensaje: result.insertId,
        chatId,
        texto,
        idUsuario: userId,
        entregado: false,
        leido: false
      };

      // Emitir solo al emisor (primer check gris)
      socket.emit("chatMessage", mensaje);

      // Emitir solo al receptor (primer check gris + segundo check gris)
      socket.to(`chat_${chatId}`).emit("chatMessage", { ...mensaje, entregado: true });

    } catch (err) {
      console.error("Error guardando mensaje:", err);
    }
  });

  // Marcar mensajes como leídos
  socket.on("marcarLeido", async ({ chatId, userId }) => {
    try {
      // Actualizar todos los mensajes del chat que no sean del usuario actual y aún no leídos
      await pool.query(
        "UPDATE Mensaje SET leido = 1 WHERE Chat_idChat = ? AND Usuarios_idUsuario != ? AND leido = 0",
        [chatId, userId]
      );

      // Emitir solo a la sala que estos mensajes se leyeron
      io.to(`chat_${chatId}`).emit("mensajeLeido", { chatId });
    } catch (err) {
      console.error("Error marcando mensaje como leído:", err);
    }
  });

});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
