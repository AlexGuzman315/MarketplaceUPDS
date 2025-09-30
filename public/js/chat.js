const socket = io();
  fetch("/api/session")
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        socket.emit("registrarUsuario", data.idUsuario);
      } else {
      }
    });
  const urlParams = new URLSearchParams(window.location.search);
  let chatActivo = urlParams.get("chatId"); // chat seleccionado

  const input = document.getElementById("msgInput");
  const btn = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chat-container");
  const perfilContainer = document.getElementById("perfil-container");

  let usuarioId;
  fetch("/api/session")
    .then(res => res.json())
    .then(data => { usuarioId = data.idUsuario; });

  // Función para renderizar mensajes
  function renderMensaje(remitente, mensaje) {
    const div = document.createElement("div");
    div.className = remitente === "yo" ? "flex justify-end" : "flex justify-start";

    div.innerHTML = `
      <div class="max-w-xs md:max-w-md px-4 py-2 rounded-2xl relative ${
        remitente === "yo"
          ? "bg-primary text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
      }">
        <div>${mensaje.texto}</div>
        ${remitente === "yo" ? `
          <div class="flex justify-end text-xs mt-1">
            <span class="check ${mensaje.entregado ? 'text-gray-400' : 'text-gray-300'}">✓</span>
            <span class="check ml-1 ${mensaje.leido ? 'text-blue-500' : 'text-gray-300'}">✓</span>
          </div>` : ''}
      </div>
    `;

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Enviar mensaje
  btn.addEventListener("click", () => {
    const msg = input.value.trim();
    if (!msg || !chatActivo) return;

    socket.emit("chatMessage", { chatId: chatActivo, texto: msg, userId: usuarioId });
    input.value = "";
  });

  // Recibir mensajes en tiempo real
  socket.on("chatMessage", (data) => {
    if (data.chatId === chatActivo) {
      const esMio = data.idUsuario === usuarioId;
      renderMensaje(esMio ? "yo" : "otro", {
        texto: data.texto,
        leido: esMio,       // si soy yo, ya está leído
        entregado: true
      });
    }
  });

  // Actualizar checks cuando alguien lee mis mensajes
  socket.on("mensajeLeido", ({ chatId }) => {
    if (chatId === chatActivo) {
      document.querySelectorAll(`#chat-container .flex.justify-end .check:nth-child(2)`).forEach(el => {
        el.classList.remove("text-gray-300");
        el.classList.add("text-blue-500");
      });
    }
  });

  // Cargar lista de chats
  async function cargarChats() {
    try {
      const res = await fetch("/api/chats", { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error("Error cargando chats");

      const chats = await res.json();
      const lista = document.getElementById("listaChats");
      lista.innerHTML = "";

      chats.forEach(chat => {
        const a = document.createElement("div");
        a.className = "flex items-center gap-4 p-4 hover:bg-primary/10 cursor-pointer";
        a.innerHTML = `
          <img alt="Avatar" class="w-12 h-12 rounded-full" src="${chat.foto || 'default.png'}"/>
          <div class="flex-1 truncate">
            <h3 class="font-semibold">${chat.nombre}</h3>
            <p class="text-sm text-gray-500 truncate">${chat.ultimoMensaje || "Sin mensajes"}</p>
          </div>
        `;

        a.addEventListener("click", async () => {
          chatActivo = chat.idChat;
          chatContainer.innerHTML = "";
          perfilContainer.innerHTML = "";

          try {
            const res = await fetch(`/api/chats/mensajes?chatId=${chat.idChat}`, {
              method: "GET",
              credentials: "include"
            });
            if (!res.ok) throw new Error("Error cargando mensajes");

            const mensajes = await res.json();

            function estaConectado(userId, callback) {
              // Pide al servidor si el userId está conectado
              socket.emit("verificarConexion", userId, callback);
            }

            // Ejemplo de uso para mostrar el perfil del usuario:
            const b = document.createElement("div");
            b.className = "flex items-center gap-4 p-4";

            estaConectado(chat.idUsuario, (conectado) => {
              b.innerHTML = `
                <img alt="Seller Avatar" class="w-10 h-10 rounded-full" src="${chat.foto || 'default.png'}"/>
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">${chat.nombre}</h2>
                <span class="w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-gray-400'}"></span>
              `;
            });
            perfilContainer.appendChild(b);

            mensajes.forEach(m => {
              const esMio = m.idUsuario === m.userIdLogueado;
              renderMensaje(esMio ? "yo" : "otro", {
                texto: m.contenido,
                leido: esMio ? m.leido : false,
                entregado: true
              });
            });

            // Marcar mensajes como leídos
            socket.emit("marcarLeido", { chatId: chatActivo, userId: usuarioId });
          } catch (err) {
            console.error("Error cargando mensajes:", err);
          }
        });

        lista.appendChild(a);
      });
    } catch (err) {
      console.error("Error cargando chats:", err);
    }
  }

  cargarChats();