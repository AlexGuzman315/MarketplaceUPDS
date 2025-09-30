let currentPage = 1;

  async function cargarArticulos() {
    try {
      const res = await fetch(`/api/articulos/destacados?page=${currentPage}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("verMasBtn").style.display = "none";
        return;
      }

      const grid = document.getElementById("articulosGrid");

      data.forEach(art => {
        const card = document.createElement("div");
        card.className = "bg-surface-light dark:bg-surface-dark rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group flex flex-col";

        card.innerHTML = `
          <div class="relative">
            <img src="${art.imagen_principal || 'default.png'}" alt="${art.titulo}" class="w-full h-48 object-cover">
            <div class="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">${art.estado}</div>
          </div>
          <div class="p-4 flex-grow flex flex-col">
            <h3 class="font-bold text-lg mb-1 text-text-light dark:text-text-dark group-hover:text-primary transition-colors">${art.titulo}</h3>
            <p class="text-text-muted-light dark:text-text-muted-dark text-sm mb-4 flex-grow">${art.descripcion}</p>
            <span class="text-lg font-bold text-primary mb-2">Bs. ${art.precio}</span>
            <button data-id="${art.idarticulo}" class="btn-detalle w-full mt-auto bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
              Ver más detalle
            </button>
          </div>
        `;

        // 👉 Ahora sí funciona porque el botón tiene la clase btn-detalle
        card.querySelector(".btn-detalle").addEventListener("click", (e) => {
          const articuloId = e.target.getAttribute("data-id");
          window.location.href = `DetalleArticulo.html?id=${articuloId}`;
        });

        grid.appendChild(card);
      });

      currentPage++;
    } catch (err) {
      console.error("Error al cargar artículos:", err);
    }
  }

  document.getElementById("verMasBtn").addEventListener("click", cargarArticulos);

  // Cargar los primeros 4 al iniciar
  cargarArticulos();