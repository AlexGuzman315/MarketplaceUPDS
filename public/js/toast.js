function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `
    px-4 py-3 rounded-lg shadow-md text-sm font-medium animate-fade-in
    ${type === "success" ? "bg-green-100 text-green-800" : ""}
    ${type === "error" ? "bg-red-100 text-red-800" : ""}
    ${type === "warning" ? "bg-yellow-100 text-yellow-800" : ""}
  `;
  toast.textContent = message;

  container.appendChild(toast);

  // Eliminar el toast después de 3 segundos
  setTimeout(() => {
    toast.classList.add("animate-fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}