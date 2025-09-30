const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const pool = require("../config/db");

const router = express.Router();

// Carpeta donde se guardarán las imágenes
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"));
    }
    cb(null, true);
  }
});

router.get("/destacados", async (req, res) => {

  if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Debes iniciar sesión" });
    }

  const page = parseInt(req.query.page) || 1;
  console.log(page);
  const limit = 4;
  const offset = (page - 1) * limit;
  const idusuario = req.session.user.idUsuario;
  console.log(offset);
  console.log(req.session.user.idUsuario);

  try {
    const [rows] = await pool.query(
      `SELECT 
          a.idarticulo, 
          a.titulo, 
          a.descripcion, 
          a.precio, 
          a.stock, 
          a.estado, 
          a.fecha_registro,
          ai.filename AS imagen_principal
      FROM articulo a
      LEFT JOIN articulo_imagenes ai
          ON a.idarticulo = ai.articulo_id AND ai.orden = 0
      WHERE a.estado = 'Disponible'
        AND a.usuario_id <> ?
      ORDER BY a.precio DESC
      LIMIT ? OFFSET ?`,
      [idusuario,limit, offset]
    );

    console.log(rows);

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener artículos destacados:", error);
    res.status(500).json({ error: "Error al obtener artículos" });
  }
});


// Obtener los artículos del usuario logueado con su imagen principal
router.get("/mis-articulos", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Debes iniciar sesión" });
    }

    const usuarioId = req.session.user.idUsuario;
    console.log("Usuario en sesión:", usuarioId);

    const [rows] = await pool.query(
      `SELECT a.idarticulo, a.titulo, a.descripcion, a.precio, a.stock, a.estado, a.fecha_registro,
              ai.filename AS imagen_principal
       FROM articulo a
       LEFT JOIN articulo_imagenes ai 
         ON a.idarticulo = ai.articulo_id AND ai.orden = 0
       WHERE a.usuario_id = ?
       ORDER BY a.fecha_registro DESC`,
      [usuarioId]
    );

    res.json({ success: true, articulos: rows });
    console.log("Usuario en sesión:", { success: true, articulos: rows });

  } catch (err) {
    console.error("Error al obtener artículos:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

router.get("/pendientes", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.idArticulo, a.titulo, a.descripcion, a.usuario_id, u.nombre, u.apellidoPaterno, i.filename, i.orden
      FROM articulo a
      JOIN usuario u ON a.usuario_id = u.idUsuario
      LEFT JOIN articulo_imagenes i ON a.idArticulo = i.idArticulo_imagenes
      WHERE a.estado = 'Pendiente'
      ORDER BY i.orden ASC
    `);

    console.log("articulo ", rows);

    // Agrupar artículos y quedarse solo con imagen de orden 0
    const articulos = [];
    const vistos = new Set();

    for (let row of rows) {
      if (!vistos.has(row.idArticulo)) {
        articulos.push({
          id: row.idArticulo,
          titulo: row.titulo,
          idUsuario: row.idUsuario,
          descripcion: row.descripcion,
          usuario: row.nombre + " " + row.apellidoPaterno,
          imagen: row.filename || "/images/sin_foto.png"
        });
        vistos.add(row.idArticulo);
      }
    }
    console.log("articulo ", articulos);
    res.json(articulos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener artículos" });
  }
});

// Obtener detalle de un artículo por id
router.get("/:id", async (req, res) => {
  try {
    const articuloId = req.params.id;

    // Traer el artículo
    const [articuloRows] = await pool.query(
      `SELECT a.idarticulo, a.titulo, a.descripcion, a.precio, a.stock, a.estado, a.fecha_registro,a.categoria_id,
              c.nombre AS categoria,
              u.nombre AS usuario, u.apellidoPaterno AS apellido, a.usuario_id AS UsuarioId
       FROM articulo a
       JOIN categoria c ON a.categoria_id = c.idcategoria
       JOIN usuario u ON a.usuario_id = u.idusuario
       WHERE a.idarticulo = ?`,
      [articuloId]
    );

    if (articuloRows.length === 0) {
      return res.status(404).json({ success: false, message: "Artículo no encontrado" });
    }

    const articulo = articuloRows[0];

    // Traer las imágenes ordenadas
    const [imagenes] = await pool.query(
      `SELECT filename, orden 
       FROM articulo_imagenes 
       WHERE articulo_id = ? 
       ORDER BY orden ASC`,
      [articuloId]
    );

    articulo.imagenes = imagenes;

    res.json({ success: true, articulo });

  } catch (err) {
    console.error("Error al obtener detalle del artículo:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// Publicar artículo
router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Debes iniciar sesión" });
    }

    const { titulo, descripcion, precio, stock, categoria } = req.body;

    if (!titulo || !descripcion || !precio || !stock || !categoria) {
      return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
    }

    // Insertar artículo
    const [result] = await pool.query(
      "INSERT INTO articulo (titulo, descripcion, precio, stock, categoria_id, usuario_id, fecha_registro, estado) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)",
      [titulo, descripcion, precio, stock, categoria, req.session.user.idUsuario, "Pendiente"]
    );

    const articuloId = result.insertId;

    // Insertar imágenes si hay
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file, index) => [
        articuloId, 
        `/uploads/${file.filename}`,
        index
      ]);

      const placeholders = images.map(() => "(?, ?, ?)").join(", ");
      const values = images.flat();

      await pool.query(
        `INSERT INTO articulo_imagenes (articulo_id, filename, orden) VALUES ${placeholders}`,
        values
      );
    }

    res.json({ success: true, message: "Artículo publicado correctamente" });

  } catch (err) {
    console.error("Error al publicar artículo:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});


// Editar artículo
router.put("/:id", upload.array("files", 10), async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: "Debes iniciar sesión", redirect: "/iniciosesion.html" });
        }

        const articuloId = req.params.id;
        const usuarioId = req.session.user.idUsuario;
        const { titulo, descripcion, precio, stock, categoria, existingImages } = req.body;

        // Traer artículo y verificar propiedad
        const [articuloRows] = await pool.query(
            "SELECT usuario_id FROM articulo WHERE idarticulo = ?",
            [articuloId]
        );
        if (articuloRows.length === 0) {
            return res.status(404).json({ success: false, message: "Artículo no encontrado" });
        }
        if (articuloRows[0].usuario_id !== usuarioId) {
            return res.status(403).json({ success: false, message: "No tienes permiso para editar este artículo" });
        }

        // Validar campos obligatorios
        if (!titulo || !descripcion || !precio || !stock || !categoria) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
        }

        // Traer imágenes actuales
        const [imagenesActuales] = await pool.query(
            "SELECT filename, orden FROM articulo_imagenes WHERE articulo_id = ?",
            [articuloId]
        );

        // Filtrar existingImages: si no se envía como array, convertir a array
        let existing = [];
        if (existingImages) {
            existing = Array.isArray(existingImages) ? existingImages : [existingImages];
        }

        // Validar que haya al menos una imagen
        if ((req.files.length + existing.length) === 0) {
            return res.status(400).json({ success: false, message: "Debe haber al menos una imagen" });
        }

        // Eliminar archivos que ya no existen
        imagenesActuales.forEach(img => {
            if (!existing.includes(img.filename)) {
                const filePath = path.join(uploadDir, path.basename(img.filename));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        });

        // Borrar registros de DB que no están en existing
        await pool.query(
            "DELETE FROM articulo_imagenes WHERE articulo_id = ? AND filename NOT IN (?)",
            [articuloId, existing.length > 0 ? existing : [""]]
        );

        // Calcular el siguiente orden
        let maxOrden = 0;
        if (imagenesActuales.length > 0) {
            // Convertir todos los órdenes a Number y descartar NaN
            const ordenes = imagenesActuales
                .map(img => Number(img.orden))
                .filter(n => !isNaN(n));
            maxOrden = ordenes.length > 0 ? Math.max(...ordenes) + 1 : 0;
        }

        // Insertar nuevas imágenes con orden correcto
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file, index) => [
                articuloId,
                `/uploads/${file.filename}`,
                maxOrden + index
            ]);

            const placeholders = newImages.map(() => "(?, ?, ?)").join(", ");
            const values = newImages.flat();

            await pool.query(
                `INSERT INTO articulo_imagenes (articulo_id, filename, orden) VALUES ${placeholders}`,
                values
            );
        }

        // Actualizar datos del artículo
        await pool.query(
            "UPDATE articulo SET titulo = ?, descripcion = ?, precio = ?, stock = ?, categoria_id = ? WHERE idarticulo = ?",
            [titulo, descripcion, precio, stock, categoria, articuloId]
        );

        res.json({ success: true, message: "Artículo actualizado correctamente" });

    } catch (err) {
        console.error("Error al editar artículo:", err);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

// Eliminar artículo
router.delete("/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: "Debes iniciar sesión" });
        }

        const articuloId = req.params.id;
        const usuarioId = req.session.user.idUsuario;

        // Verificar que el artículo pertenece al usuario
        const [articuloRows] = await pool.query(
            "SELECT usuario_id FROM articulo WHERE idarticulo = ?",
            [articuloId]
        );
        if (articuloRows.length === 0) {
            return res.status(404).json({ success: false, message: "Artículo no encontrado" });
        }
        if (articuloRows[0].usuario_id !== usuarioId) {
            return res.status(403).json({ success: false, message: "No tienes permiso para eliminar este artículo" });
        }

        // Traer imágenes para borrar de la carpeta
        const [imagenes] = await pool.query(
            "SELECT filename FROM articulo_imagenes WHERE articulo_id = ?",
            [articuloId]
        );
        imagenes.forEach(img => {
            const filePath = path.join(uploadDir, path.basename(img.filename));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        // Borrar registros de imágenes
        await pool.query("DELETE FROM articulo_imagenes WHERE articulo_id = ?", [articuloId]);
        // Borrar artículo
        await pool.query("DELETE FROM articulo WHERE idarticulo = ?", [articuloId]);

        res.json({ success: true, message: "Artículo eliminado correctamente" });

    } catch (err) {
        console.error("Error al eliminar artículo:", err);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});


module.exports = router;
