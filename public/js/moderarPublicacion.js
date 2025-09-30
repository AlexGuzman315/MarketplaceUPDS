
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/articulos/pendientes")
    .then(res => res.json())
    .then(articulos => {
      const tbody = document.querySelector("tbody");
      tbody.innerHTML = "";

      articulos.forEach(a => {
        tbody.innerHTML += `
          <tr>
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center" 
                     style="background-image: url('${a.imagen}')"></div>
                <span>${a.titulo}</span>
              </div>
            </td>
            <td class="px-6 py-4">${a.usuario}</td>
            <td class="px-6 py-4 max-w-sm truncate">${a.descripcion}</td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-center gap-2">
                <button class="bg-primary text-white px-3 py-2 rounded text-xs">Publicar</button>
                <button class="bg-red-500 text-white px-3 py-2 rounded text-xs">Rechazar</button>
              </div>
            </td>
          </tr>
        `;
      });
    })
    .catch(err => console.error("Error cargando pendientes:", err));
});
