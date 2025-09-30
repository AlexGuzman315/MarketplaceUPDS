const fileInput = document.getElementById('file-upload');
const previewImg = document.getElementById('preview-img');
const iconoSpan = document.getElementById("icon");
const pesoParrafo = document.getElementById("peso");

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.classList.remove('hidden'); // mostrar la imagen
    if (iconoSpan) iconoSpan.textContent = "";
    if (pesoParrafo) pesoParrafo.textContent = "";
  };
  reader.readAsDataURL(file);
});

document.getElementById("formRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener valores
    const nombre = document.getElementById("nombre").value.trim();
    const apellidoPaterno = document.getElementById("apellido-paterno").value.trim();
    const apellidoMaterno = document.getElementById("apellido-materno").value.trim(); // opcional
    const telefono = document.getElementById("telefono").value.trim();
    const ci = document.getElementById("ci").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const carrera = document.getElementById("carrera").value.trim();
    const file = document.getElementById("file-upload").files[0]; // opcional

    // Validaciones
    if (!nombre || !apellidoPaterno || !telefono || !ci || !email || !password) {
        alert("Por favor, completa todos los campos obligatorios");
        return;
    }

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // Preparar FormData para enviar archivo y datos
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("apellidoPaterno", apellidoPaterno);
    formData.append("apellidoMaterno", apellidoMaterno || "");
    formData.append("telefono", telefono);
    formData.append("ci", ci);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("carrera", carrera);
    if (file) formData.append("foto", file);

    try {
        const res = await fetch("/api/registrar", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            alert("Usuario registrado correctamente");
            document.getElementById("formRegistro").reset();
            previewImg.classList.add("hidden");
            window.location.href = "/iniciosesion.html";
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Error en el registro");
    }
});

