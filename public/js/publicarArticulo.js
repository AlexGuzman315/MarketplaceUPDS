let allFiles = new Map(); // ⚠️ Definir aquí para que todos los scripts puedan acceder

  document.addEventListener("DOMContentLoaded", async () => {
    const fileInput = document.getElementById("fileInput");
    const previewContainer = document.getElementById("previewContainer");
    const form = document.getElementById("formArticulo");
    const btnPublish = document.getElementById("btn-publish");
    const categorySelect = document.getElementById("category");
    const MAX_FILES = 10;
    let fileCounter = 0;

    try {
        const res = await fetch("/api/categorias");
        const categorias = await res.json();

        // Limpia el select
        //categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

        // Agrega las categorías de la BD
        categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.idcategoria;
        option.textContent = cat.nombre;
        categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error cargando categorías:", err);
        categorySelect.innerHTML = '<option>Error al cargar</option>';
    }
    

    fileInput.addEventListener("change", () => {
      const newFiles = Array.from(fileInput.files);
      
      if (allFiles.size + newFiles.length > MAX_FILES) {
        alert(`Máximo ${MAX_FILES} archivos permitidos`);
        fileInput.value = "";
        return;
      }

      newFiles.forEach(file => {
        const fileId = `file_${fileCounter++}`;
        allFiles.set(fileId, file);
      });

      renderPreviews();
      fileInput.value = "";
    });

    function renderPreviews() {
      previewContainer.innerHTML = "";
      allFiles.forEach((file, fileId) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement("div");
          div.classList.add("relative", "group", "animate-fade-in");

          div.innerHTML = `
            <img src="${e.target.result}" alt="Preview" class="h-24 w-full object-cover rounded-lg"/>
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                <button class="text-white p-1 rounded-full bg-red-500 hover:bg-red-600" data-fileid="${fileId}" title="Eliminar imagen">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
          `;

          div.querySelector("button").addEventListener("click", (event) => {
            const fileIdToRemove = event.target.closest('button').dataset.fileid;
            allFiles.delete(fileIdToRemove);
            renderPreviews();
          });

          previewContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
      });

      updateFileCounter();
    }

    function updateFileCounter() {
      const oldCounter = document.getElementById('fileCounter');
      if (oldCounter) oldCounter.remove();

      const counter = document.createElement('div');
      counter.id = 'fileCounter';
      counter.className = 'text-sm text-gray-600 dark:text-gray-400 mt-2';
      counter.textContent = `${allFiles.size} de ${MAX_FILES} archivos`;
      previewContainer.parentNode.appendChild(counter);
    }

    btnPublish.addEventListener("click", async () => {
        const titulo = document.getElementById("title").value.trim();
        const descripcion = document.getElementById("description").value.trim();
        const precio = document.getElementById("precio").value;
        const stock = document.getElementById("stock").value;
        const categoria = document.getElementById("category").value;

        if (!titulo || !descripcion || !precio || !stock || !categoria) {
        alert("Todos los campos son obligatorios");
        return;
        }

        // FormData para enviar texto + archivos
        const formData = new FormData();
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);
        formData.append("precio", precio);
        formData.append("stock", stock);
        formData.append("categoria", categoria);

        // Archivos
        allFiles.forEach(file => formData.append("files", file));

        try {
        const res = await fetch("/api/articulos", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            alert("Artículo publicado correctamente");
            form.reset();
            allFiles.clear();
            document.getElementById("previewContainer").innerHTML = "";
        } else {
            alert("Error: " + data.message);
        }
        } catch (err) {
        console.error(err);
        alert("Error al enviar el artículo");
        }
    });
    
    const driver = window.driver.js.driver({
      showProgress: true,  // Muestra el progreso (ej: 1/3)
      overlayOpacity: 0.6, // Oscurece el fondo
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Finalizar"
    });

    // Definir los pasos
    driver.setSteps([
      {
        element: "#inicio",
        popover: {
          title: "Menu de Inicio",
          description: "Esto te lleva a la seccion de Inicio de la pagina.",
          side: "bottom"
        }
      },
      {
        element: "#articulosPublicados",
        popover: {
          title: "Menu de Articulos Publicados",
          description: "Esta seccion te mostrara todos tus articulos publicados",
          side: "bottom"
        }
      },
      {
        element: "#articulosIntercambiados",
        popover: {
          title: "Menu de Articulos Intercambiados",
          description: "Esta seccion te mostrara todos tus articulos Intercambiados.",
          side: "bottom"
        }
      },
      {
        element: "#chat",
        popover: {
          title: "Menu de Chat",
          description: "Aquí te mostrara todos tus chats",
          side: "bottom"
        }
      },
      {
        element: "#notificacion",
        popover: {
          title: "Notificaciones",
          description: "Aquí te mostrara todas las notificaciones de tus publicaciones o contactos.",
          side: "bottom"
        }
      },
      {
        element: "#perfil",
        popover: {
          title: "Perfil",
          description: "Aquí te mostrara todos tus datos personales.",
          side: "bottom"
        }
      },
      {
        element: "#title",
        popover: {
          title: "Título del artículo",
          description: "Aquí debes escribir el nombre del artículo que quieres intercambiar.",
          side: "bottom"
        }
      },
      {
        element: "#description",
        popover: {
          title: "Descripción",
          description: "Detalla el estado de tu artículo y qué buscas a cambio.",
          side: "right"
        }
      },
      {
        element: "#category",
        popover: {
          title: "Categoría",
          description: "Selecciona a qué categoría pertenece tu artículo.",
          side: "bottom"
        }
      },
      {
        element: "#dropzone-file",
        popover: {
          title: "Sube fotos",
          description: "Añade imágenes de tu artículo para que otros lo vean.",
          side: "bottom"
        }
      },
      {
        element: "#delete-file",
        popover: {
          title: "Fotos Agregada",
          description: "Puedes eliminar tus fotos que no desee subir presionando click al centro de la imagen.",
          side: "top"
        }
      },
      {
        element: "#btn-preview",
        popover: {
          title: "Previsualizar",
          description: "Haz clic aquí para ver cómo se mostrará tu publicación antes de enviarla.",
          side: "top"
        }
      },
      {
        element: "#btn-publish",
        popover: {
          title: "Publicar artículo",
          description: "Cuando todo esté listo, publica tu artículo para que otros lo vean.",
          side: "top"
        }
      }
    ]);

    // Lanzar el tour al hacer clic en un botón
    document.querySelector("#startTour").addEventListener("click", () => {
      driver.drive();
    });
  });