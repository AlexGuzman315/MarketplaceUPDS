const btn = document.getElementById('acceso');
    btn.addEventListener('click', () => {
        window.location.href = 'iniciosesion.html';
    });

const btnAcceso = document.getElementById("acceso");
  const socket = io();
  fetch("/api/session")
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        socket.emit("registrarUsuario", data.idUsuario);
        // Cambiar texto a "Cerrar sesión"
        btnAcceso.textContent = "Cerrar sesión";
        // Cambiar la acción para cerrar sesión
        btnAcceso.onclick = () => {
          window.location.href = "/logout";
        };
      } else {
        // Si no está logueado, sigue apuntando al login
        btnAcceso.textContent = "Acceder";
        btnAcceso.onclick = () => {
          window.location.href = "/iniciosesion.html";
        };
      }
    });

document.addEventListener("DOMContentLoaded", () => {

  fetch("/api/session")
    .then(res => res.json())
    .then(data => {
      const perfilBtn = document.getElementById("perfilBtn");
      const nombreSpan = document.getElementById("nombre");

      if (!perfilBtn) return; // Si no existe, no hacer nada

      if (!data.loggedIn) {
        perfilBtn.classList.add("hidden");
        if (nombreSpan) nombreSpan.textContent = "";
      } else {
        perfilBtn.classList.remove("hidden");

        // Imagen de perfil
        const img = document.createElement("img");
        img.src = data.perfil 
          ? "/images/perfiles/" + data.perfil 
          : "/images/sin_perfil.png";
        img.alt = "Foto de perfil";
        img.classList.add("size-10", "rounded-full", "object-cover");
        perfilBtn.innerHTML = "";
        perfilBtn.appendChild(img);

        // Actualizar el span del nombre
        if (nombreSpan) {
          nombreSpan.textContent = `Hola, ${data.nombre}`;
        }
      }
    })
    .catch(err => console.error(err));
});
