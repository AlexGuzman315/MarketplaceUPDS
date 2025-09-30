document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/session")
        .then(res => res.json())
        .then(data => {
            const perfilBtn = document.getElementById("perfilBtn");
            if (!data.loggedIn) {
                perfilBtn.classList.add("hidden");
            } else {
                perfilBtn.classList.remove("hidden");
                const nombre = document.createElement("span");
                nombre.textContent = `Hola, ${data.nombre}`;
                perfilBtn.parentNode.insertBefore(nombre, perfilBtn.nextSibling);
            }
        });

    cargarArticulos();
    cargarCategorias();
});

// Redirigir al publicar artículo
document.getElementById('btnNuevoArticulo').addEventListener('click', () => {
    window.location.href = 'PublicarArticulo.html';
});

async function cargarCategorias() {
    const catSelect = document.getElementById("editarCategoria");
    try {
        const res = await fetch("/api/categorias"); // endpoint que devuelve todas las categorías
        const categorias = await res.json();

        catSelect.innerHTML = ''; // limpiar opciones

        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.idcategoria;
            option.textContent = cat.nombre;
            catSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error cargando categorías:", err);
        catSelect.innerHTML = '<option value="">Error al cargar</option>';
    }
}

// Variables para manejo de imágenes en el modal
const previewContainer = document.getElementById("previewContainer");
const fileInput = document.getElementById("editarImagenes");
const btnAgregar = document.getElementById("btnAgregarImagen");
const MAX_FILES = 5;
let allFiles = new Map();          // Nuevas imágenes
let existingImages = new Map();    // Imágenes existentes
let fileCounter = 0;

btnAgregar.addEventListener("click", (e) => {e.preventDefault(); fileInput.click()});

// Escuchar cambios en el input de archivos
fileInput.addEventListener("change", () => {
    const newFiles = Array.from(fileInput.files);
    if (allFiles.size + existingImages.size + newFiles.length > MAX_FILES) {
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

// Renderizar previews de todas las imágenes
function renderPreviews() {
    previewContainer.innerHTML = "";

    // Mostrar imágenes existentes
    existingImages.forEach((img, id) => {
        const div = document.createElement("div");
        div.classList.add("relative", "group");
        div.innerHTML = `
            <img src="${img}" alt="Preview" class="h-24 w-full object-cover rounded-lg"/>
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                <button class="text-white p-1 rounded-full bg-red-500 hover:bg-red-600" data-fileid="${id}" data-type="existing" title="Eliminar imagen">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        `;
        div.querySelector("button").addEventListener("click", (event) => {
            const fileIdToRemove = event.target.closest('button').dataset.fileid;
            existingImages.delete(fileIdToRemove);
            renderPreviews();
        });
        previewContainer.appendChild(div);
    });

    // Mostrar imágenes nuevas
    allFiles.forEach((file, fileId) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement("div");
            div.classList.add("relative", "group");
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview" class="h-24 w-full object-cover rounded-lg"/>
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <button class="text-white p-1 rounded-full bg-red-500 hover:bg-red-600" data-fileid="${fileId}" data-type="new" title="Eliminar imagen">
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

// Actualizar contador de archivos
function updateFileCounter() {
    const oldCounter = document.getElementById('fileCounter');
    if (oldCounter) oldCounter.remove();
    const counter = document.createElement('div');
    counter.id = 'fileCounter';
    counter.className = 'text-sm text-gray-600 dark:text-gray-400 mt-2';
    counter.textContent = `${allFiles.size + existingImages.size} de ${MAX_FILES} archivos`;
    previewContainer.parentNode.appendChild(counter);
}

// Cargar artículos
async function cargarArticulos() {
    try {
        const res = await fetch("/api/articulos/mis-articulos");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const contenedor = document.getElementById("articulosGrid");
        contenedor.innerHTML = "";

        data.articulos.forEach(art => {
            const estadoColor = art.estado === "Disponible" ? "bg-primary/10 text-primary"
                               : art.estado === "Pendiente" ? "bg-warning/10 text-warning"
                               : "bg-success/10 text-success";

            contenedor.innerHTML += `
                <div class="bg-white dark:bg-subtle-dark rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
                    <img src="${art.imagen_principal || 'https://via.placeholder.com/400x300'}" class="w-full h-48 object-cover" />
                    <div class="p-3 flex-grow flex flex-col">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-lg font-bold text-foreground-light dark:text-foreground-dark">${art.titulo}</h3>
                            <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${estadoColor}">${art.estado}</span>
                        </div>
                        <p class="text-sm text-muted-light dark:text-muted-dark mb-4 flex-grow">${art.descripcion}</p>
                        <div class="border-t border-subtle-light dark:border-subtle-dark/50 pt-4 flex justify-end gap-2">
                            <button data-id="${art.idarticulo}" class="btn-editar bg-warning/10 text-warning text-sm font-medium py-1 px-3 rounded-full hover:bg-warning/20 transition-colors">Editar</button>
                            <button data-id="${art.idarticulo}" class="btn-eliminar bg-red-100 text-red-600 text-sm font-medium py-1 px-3 rounded-full hover:bg-red-200 transition-colors">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Error al cargar artículos:", err);
    }
}

// Editar artículo
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-editar")) {
        const id = e.target.getAttribute("data-id");
        fetch(`/api/articulos/${id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                const art = data.articulo;
                document.getElementById("editarId").value = art.idarticulo;
                document.getElementById("editarTitulo").value = art.titulo;
                document.getElementById("editarDescripcion").value = art.descripcion;
                document.getElementById("editarPrecio").value = art.precio;
                document.getElementById("editarStock").value = art.stock;

                // Categoría
                const catSelect = document.getElementById("editarCategoria");
                if (catSelect) {
                    catSelect.value = art.categoria_id || ""; // Asigna la categoría actual
                }

                // Limpiar previews
                allFiles.clear();
                existingImages.clear();
                previewContainer.innerHTML = "";

                // Cargar imágenes existentes
                if (art.imagenes && art.imagenes.length > 0) {
                    art.imagenes.forEach((img, index) => {
                        existingImages.set(`exist_${index}`, img.filename);
                    });
                }

                renderPreviews();
                document.getElementById("editModal").classList.remove("hidden");
            });
    }
});

// Eliminar artículo
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-eliminar")) {
        const id = e.target.getAttribute("data-id");

        // Ventana emergente de confirmación
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/api/articulos/${id}`, {
                        method: "DELETE"
                    });
                    const data = await res.json();
                    if (data.success) {
                        Swal.fire(
                            'Eliminado',
                            'El artículo se eliminó correctamente.',
                            'success'
                        );
                        cargarArticulos(); // recarga la lista
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    }
                } catch (err) {
                    Swal.fire('Error', 'No se pudo eliminar el artículo', 'error');
                }
            }
        });
    }
});


// Cerrar modal
document.getElementById("closeEditModal").addEventListener("click", () => {
    document.getElementById("editModal").classList.add("hidden");
});
document.getElementById("cancelarEdicion").addEventListener("click", () => {
    document.getElementById("editModal").classList.add("hidden");
});

// Guardar cambios
document.getElementById("formEditar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editarId").value;

    const titulo = document.getElementById("editarTitulo").value.trim();
    const descripcion = document.getElementById("editarDescripcion").value.trim();
    const precio = document.getElementById("editarPrecio").value.trim();
    const stock = document.getElementById("editarStock").value.trim();
    const categoria = document.getElementById("editarCategoria").value;

    // Validar campos obligatorios
    if (!titulo || !descripcion || !precio || !stock || !categoria) {
        alert("Todos los campos son obligatorios");
        return;
    }

    // Validar al menos una imagen
    if (allFiles.size + existingImages.size === 0) {
        alert("Debe subir al menos una imagen del artículo");
        return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("categoria", categoria);

    // Añadir nuevas imágenes
    allFiles.forEach(file => formData.append("files", file));

    // Enviar IDs de imágenes existentes a mantener
    existingImages.forEach((filename, key) => formData.append("existingImages", filename));

    try {
        const res = await fetch(`/api/articulos/${id}`, {
            method: "PUT",
            body: formData
        });

        const data = await res.json();
        if (!data.success) {
            if (data.redirect) {
                // Redirigir a la página de login
                window.location.href = data.redirect;
            } else {
                alert("Error al actualizar: " + data.message);
            }
        } else {
            alert("Artículo actualizado con éxito");
            document.getElementById("editModal").classList.add("hidden");
            cargarArticulos();
        }
    } catch (err) {
        console.error("Error al actualizar artículo:", err);
        alert("Ocurrió un error al actualizar el artículo");
    }
});

