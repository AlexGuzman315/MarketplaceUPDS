document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/session")
    .then(res => res.json())
    .then(data => {
      const perfilBtn = document.getElementById("perfilBtn");
      if (!data.loggedIn) {
        // Si NO está logueado, ocultar el botón
        perfilBtn.style.display = "none";
      } else {
        // Opcional: mostrar el nombre del usuario al lado de la foto
        const nombre = document.createElement("span");
        nombre.textContent = `Hola, ${data.nombre}`;
        perfilBtn.parentNode.insertBefore(nombre, perfilBtn.nextSibling);
      }
    });
});