// public/js/login.js
async function login(email, password, rol) {
  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rol })
  });

  const data = await res.json();
  showToast(data.message, data.success ? "success" : "error");

  if (data.success) {
    setTimeout(() => {
      switch(data.idRol) {
        case "1":
          window.location.href = "/index.html";
          break;
        default:
          window.location.href = "/ModerarUsuario.html";
      }
    }, 1500);
  }
}

// Capturar evento del formulario
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const rol = document.getElementById("rol").value;
  login(email, password, rol);
});

document.addEventListener("DOMContentLoaded", async () => {

  const RolContenedor = document.getElementById("rol");
  try {
        const res = await fetch("/api/roles");
        const roles = await res.json();

        // Limpia el select
        //categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

        // Agrega las categorías de la BD
        roles.forEach(rol => {
        const option = document.createElement("option");
        option.value = rol.idRoles;
        option.textContent = rol.nombre;
        RolContenedor.appendChild(option);
        });
    } catch (err) {
        console.error("Error cargando roles:", err);
        categorySelect.innerHTML = '<option>Error al cargar</option>';
    }
  });
