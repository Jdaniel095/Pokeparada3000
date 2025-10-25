// ===============================
// js/tab1_generate.js
// ===============================

// -----------------------------
// 🌟 Configuración global
// -----------------------------
const testFiles = [
  { id: "test1", name: "Prueba 1", thumbnailLink: "https://wallpapers.com/images/hd/eevee-pictures-9pvgmfx7wz4qeyuj.jpg" },
  { id: "test2", name: "Prueba 2", thumbnailLink: "https://www.shutterstock.com/image-vector/vector-pikachu-on-yellow-background-260nw-2317088997.jpg" },
  { id: "test3", name: "Prueba 3", thumbnailLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SitwRF8aFBgyOkp-K853HhxLSYW8wkecyw&s" },
  { id: "test4", name: "Prueba 4", thumbnailLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZF_P5hyV_zmUTvBU9gtFH2iLrVTLvMamKow&s" }
];

let files = [];
let selected = new Set();
let accesoSelected = new Set();
let nombreSesionActual = ""; 

const DEPLOY_URL = window.APP_CONFIG.SHEET_URL;

// -----------------------------
// 🚀 Inicializador de la pestaña
// -----------------------------
window.initTab1 = function () {
  console.log("🧩 Pestaña Generar iniciada");
  setupToggles();
  setupDriveFunctions();
  setupSesionFunctions(); 
  initSeccion3Ubicaciones(); 
  initSeccion4Propuestas(); // 👈 nueva línea
};

// -----------------------------
// 🟦 Toggles de secciones
// -----------------------------
function setupToggles() {
  const container = document.getElementById("tab-content");
  if (!container) return;
  const toggles = container.querySelectorAll(".toggle-btn");

  toggles.forEach(btn => {
    const card = btn.closest(".section-card");
    const content = card.querySelector(".section-content");
    content.style.display = content.style.display || "block";
    btn.textContent = "−";

    btn.addEventListener("click", () => {
      const isHidden = window.getComputedStyle(content).display === "none";
      content.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "−" : "+";
    });
  });
}

// -----------------------------
// 🟨 Drive: listado y selección
// -----------------------------
function setupDriveFunctions() {
  const { API_KEY, DRIVE_FOLDER_ID } = window.APP_CONFIG;

  async function listDriveFiles() {
    let driveFiles = [];
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q='${DRIVE_FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,thumbnailLink,webContentLink)`;
      const res = await fetch(url);
      const data = await res.json();
      driveFiles = data.files || [];
    } catch (err) {
      console.warn("⚠️ No se pudo conectar a Drive, usando imágenes demo");
    }

    const uniqueFiles = {};
    [...driveFiles, ...testFiles].forEach(f => {
      if (!uniqueFiles[f.name]) uniqueFiles[f.name] = f;
    });
    files = Object.values(uniqueFiles);
    renderFiles();
  }

  function renderFiles() {
    const cont = document.getElementById("filesList");
    if (!cont) return;
    cont.innerHTML = "";

    files.forEach((f, i) => {
      const isSel = selected.has(f.id);
      const isAcceso = accesoSelected.has(f.id);
      const thumb = f.thumbnailLink || "";

      const card = document.createElement("div");
      card.classList.add("drive-thumb");

      card.innerHTML = `
        <div class="file-wrapper left">
          <input type="checkbox" id="poke-${f.id}" class="file-toggle" ${isSel ? "checked" : ""}/>
          <label for="poke-${f.id}" class="file-check">✓</label>
        </div>
        <div class="file-wrapper right">
          <input type="checkbox" id="acceso-${f.id}" class="file-toggle" ${isAcceso ? "checked" : ""}/>
          <label for="acceso-${f.id}" class="file-check acceso">✓</label>
        </div>
        <img src="${thumb}" alt="${f.name}">
        <div class="thumb-num">#${i + 1}</div>
      `;

      card.querySelector(`#poke-${f.id}`).addEventListener("change", e => {
        if (e.target.checked) {
          selected.add(f.id);
          accesoSelected.delete(f.id);
        } else {
          selected.delete(f.id);
        }
        renderFiles();
      });

      card.querySelector(`#acceso-${f.id}`).addEventListener("change", e => {
        if (e.target.checked) {
          accesoSelected.add(f.id);
          selected.delete(f.id);
        } else {
          accesoSelected.delete(f.id);
        }
        renderFiles();
      });

      cont.appendChild(card);
    });

    const spans = document.querySelectorAll("#filesCounter span");
    if (spans.length >= 3) {
      spans[0].textContent = `Total: ${files.length}`;
      spans[1].textContent = `Poképaradas: ${selected.size}`;
      spans[2].textContent = `Accesos: ${accesoSelected.size}`;
    }
  }

  document.getElementById("btnRefresh")?.addEventListener("click", listDriveFiles);
  document.getElementById("btnSelectAll")?.addEventListener("click", () => { files.forEach(f => selected.add(f.id)); renderFiles(); });
  document.getElementById("btnClearPoke")?.addEventListener("click", () => { selected.clear(); renderFiles(); });
  document.getElementById("btnClearAcceso")?.addEventListener("click", () => { accesoSelected.clear(); renderFiles(); });
  document.getElementById("btnClearAll")?.addEventListener("click", () => { selected.clear(); accesoSelected.clear(); renderFiles(); });

  document.getElementById("btnGuardarFotos")?.addEventListener("click", async () => {
    const nombreSesion = document.getElementById("inputNombreSesion")?.value.trim();
    if (!nombreSesion) return alert("⚠️ Ingresa un nombre de sesión antes de guardar.");
    if (selected.size === 0 && accesoSelected.size === 0) return alert("⚠️ No hay imágenes seleccionadas para guardar.");

    const pares = Array.from(selected).map((p, i) => ({
      NombreSesion: nombreSesion,
      NumeroPropuesta: i + 1,
      FotoPrincipalID: p,
      FotoAccesoID: Array.from(accesoSelected)[i] || ""
    }));

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ pares }));

      const res = await fetch(window.APP_CONFIG.SHEET_URL, { method: "POST", body: formData });
      const resultText = await res.text();
      let result;
      try { result = JSON.parse(resultText); } catch { result = { ok: false, mensaje: "Respuesta no válida del servidor" }; }
      alert(result.ok ? `✅ Guardado exitoso: ${result.mensaje}` : `⚠️ Error al guardar: ${result.mensaje}`);

      if (result.ok) {
        await actualizarCollageDespuesDeGuardar();
        selected.clear();
        accesoSelected.clear();
        renderFiles();
      }
    } catch (err) {
      console.error("❌ Error al enviar a Sheets:", err);
      alert("❌ No se pudo conectar al servidor de Google Sheets.");
    }
  });

  listDriveFiles();
}

// -----------------------------
// 💾 Manejo de Sesión Temporal
// -----------------------------
function setupSesionFunctions() {
  const inputSesion = document.getElementById("inputNombreSesion");
  const btnGuardarSesion = document.getElementById("btnGuardarSesion");
  if (!inputSesion || !btnGuardarSesion) return;

  btnGuardarSesion.addEventListener("click", () => {
    const nombre = inputSesion.value.trim();
    if (!nombre) return alert("⚠️ Ingresa un nombre para la sesión antes de guardar.");
    nombreSesionActual = nombre;
    localStorage.setItem("nombreSesionTemporal", nombre);
    alert(`✅ Sesión guardada: "${nombreSesionActual}"`);
  });

  const saved = localStorage.getItem("nombreSesionTemporal");
  if (saved) {
    nombreSesionActual = saved;
    inputSesion.value = saved;
  }
}

// -----------------------------
// 🎨 Generador de collage automático
// -----------------------------
async function generarCollageAutomatico(nombreSesion) {
  if (!nombreSesion) return;
  const preview = document.getElementById("collagePreview");
  const btnCollage = document.getElementById("btnGenerarCollage");

  preview.innerHTML = `<div class="collage-loader"><div class="pokeball-spinner"></div><p>Generando collage... por favor espera</p></div>`;
  if (btnCollage) { btnCollage.disabled = true; btnCollage.textContent = "⏳ Generando..."; }

  try {
    const resp = await fetch(`${DEPLOY_URL}?action=getFotosSesion&nombreSesion=${encodeURIComponent(nombreSesion)}`);
    const data = await resp.json();
    const fotos = data.fotos || [];
    if (!data.ok || fotos.length === 0) {
      preview.innerHTML = "<p>⚠️ No hay fotos aún para esta sesión.</p>";
      btnCollage.disabled = false;
      btnCollage.textContent = "🎨 Generar Collage";
      return;
    }

    const fotosUnicas = Array.from(new Map(fotos.map(f => [f.FotoPrincipalID, f])).values())
      .sort((a, b) => (a.NumeroPropuesta || 0) - (b.NumeroPropuesta || 0));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = 200;
    const cols = 4;
    const rows = Math.ceil(fotosUnicas.length / cols);
    canvas.width = cols * size;
    canvas.height = rows * size;

    for (let index = 0; index < fotosUnicas.length; index++) {
      const foto = fotosUnicas[index];
      const id = foto.FotoPrincipalID;
      const numero = foto.NumeroPropuesta || index + 1;
      const url = `https://lh3.googleusercontent.com/d/${id}=s800`;

      try {
        const img = await cargarImagen(url);
        const x = (index % cols) * size;
        const y = Math.floor(index / cols) * size;
        ctx.drawImage(img, x, y, size, size);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x + size - 40, y + size - 30, 35, 25);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.fillText(numero, x + size - 30, y + size - 12);
      } catch {
        const x = (index % cols) * size;
        const y = Math.floor(index / cols) * size;
        ctx.fillStyle = "#ccc";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#000";
        ctx.fillText("No disponible", x + 20, y + 100);
      }
    }

    preview.innerHTML = "";
    const imgPreview = document.createElement("img");
    imgPreview.src = canvas.toDataURL("image/png");
    imgPreview.classList.add("collage-result");
    preview.appendChild(imgPreview);

    const btnDescargar = document.createElement("button");
    btnDescargar.textContent = "💾 Descargar Collage";
    btnDescargar.className = "primary";
    btnDescargar.style.marginTop = "10px";
    btnDescargar.onclick = () => { const a = document.createElement("a"); a.href = imgPreview.src; a.download = `collage_${nombreSesion}.png`; a.click(); };
    preview.appendChild(btnDescargar);

  } catch (err) {
    console.error("❌ Error generando collage automático:", err);
    preview.innerHTML = `<p style="color:red;">❌ Error al generar collage.</p>`;
  }

  btnCollage.disabled = false;
  btnCollage.textContent = "🎨 Generar Collage";
}

async function actualizarCollageDespuesDeGuardar() {
  const nombreSesion = nombreSesionActual || document.getElementById("inputNombreSesion")?.value.trim();
  if (nombreSesion) await generarCollageAutomatico(nombreSesion);
}

function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ===================================================
// 📍 SECCIÓN 3 — Guardar y mostrar ubicaciones
// ===================================================
window.initSeccion3Ubicaciones = function () {
  const btn = document.getElementById("btnGuardarCoordenada");
  const cont = document.getElementById("ubicacionesList");
  if (!btn || !cont) return;

  btn.addEventListener("click", async () => {
    if (!nombreSesionActual) return alert("⚠️ Primero debes guardar un nombre de sesión antes de guardar coordenadas.");
    if (!navigator.geolocation) return alert("❌ Tu navegador no soporta geolocalización.");

    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const hora = new Date().toLocaleString();
      let direccion = "Obteniendo dirección...";
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await resp.json();
        direccion = data.display_name || "Dirección no encontrada";
      } catch { direccion = "No disponible"; }

      const ubicacion = {
        NombreSesion: nombreSesionActual,
        NumeroPropuesta: document.querySelectorAll(".ubicacion-item").length + 1,
        Lat: lat,
        Lng: lng,
        Direccion: direccion,
        CooTitulo: "",
        Hora: hora
      };

      agregarUbicacionVisual(ubicacion);
      await guardarUbicacionEnSheet(ubicacion);
    }, err => alert("❌ No se pudo obtener la ubicación: " + err.message));
  });

  cargarUbicacionesGuardadas(cont);
};

async function guardarUbicacionEnSheet(u) {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ ubicaciones: [u], action: "guardarUbicacion" }));
    const res = await fetch(DEPLOY_URL, { method: "POST", body: formData });
    console.log("📩 Respuesta guardado ubicación:", await res.text());
  } catch (err) {
    console.error("❌ Error al guardar ubicación:", err);
  }
}

// Función para crear visualmente la ubicación y manejar eventos
function agregarUbicacionVisual(u, numeroPropuesta = null) {
  const cont = document.getElementById("ubicacionesList");
  if (!cont) return;
  const num = numeroPropuesta || document.querySelectorAll(".ubicacion-item").length + 1;

  const item = document.createElement("div");
  item.className = "ubicacion-item";
  item.style.display = "flex";
  item.style.alignItems = "stretch";
  item.style.gap = "10px";
  item.style.border = "1px solid #444";
  item.style.padding = "10px";
  item.style.borderRadius = "10px";
  item.style.background = "#0e2239";

  item.innerHTML = `
    <div style="flex:1;max-width:150px;cursor:pointer;">
      <img src="https://maps.googleapis.com/maps/api/staticmap?center=${u.Lat},${u.Lng}&zoom=17&size=150x150&maptype=satellite&markers=color:red%7C${u.Lat},${u.Lng}&key=${window.APP_CONFIG.API_KEY}"
           alt="Mapa miniatura" style="border-radius:8px;width:100%;height:auto;">
    </div>
    <div style="flex:2;">
      <div><b>Propuesta #${num}</b> <span class="titulo-coo" style="color:#aaa;">${u.CooTitulo ? `— ${u.CooTitulo}` : ""}</span></div>
      <div>${u.Lat}, ${u.Lng}</div>
      <div style="font-size:0.9em;color:#ccc;">${u.Direccion}</div>
      <div style="font-size:0.8em;color:#999;">Guardado: ${u.Hora}</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
      <button class="editar-titulo secondary">✏️ Título</button>
      <button class="ordenar secondary">🔢 Ordenar</button>
      <button class="eliminar poke">🗑️ Eliminar</button>
    </div>
  `;

  // Click en miniatura para modal de mapa
  const img = item.querySelector("img");
  img.addEventListener("click", () => {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.8)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = 9999;

    modal.innerHTML = `
      <div style="position:relative;width:90%;height:80%;border-radius:12px;background:#fff;">
        <iframe src="https://maps.google.com/maps?q=${u.Lat},${u.Lng}&t=k&z=18&output=embed&disableDefaultUI=1&controls=0&iwloc="
          style="width:100%;height:100%;border:none;border-radius:12px;"></iframe>
        <button id="btnCerrarModal" style="position:absolute;top:10px;right:10px;padding:6px 10px;background:#fff;border:none;border-radius:4px;cursor:pointer;z-index:1000;">❌ Cerrar</button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#btnCerrarModal").addEventListener("click", () => modal.remove());
  });

  // Editar título
  item.querySelector(".editar-titulo").addEventListener("click", () => {
    const nuevoTitulo = prompt("📝 Ingresa un título para esta coordenada:", u.CooTitulo || "");
    if (nuevoTitulo !== null) {
      u.CooTitulo = nuevoTitulo;
      item.querySelector(".titulo-coo").textContent = `— ${nuevoTitulo}`;
      guardarUbicacionEnSheet(u);
    }
  });

  // Eliminar
  item.querySelector(".eliminar").addEventListener("click", async () => {
    if (!confirm("¿Eliminar esta ubicación?")) return;
    item.remove();
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        action: "eliminarUbicacion",
        NombreSesion: u.NombreSesion,
        NumeroPropuesta: u.NumeroPropuesta
      }));
      await fetch(DEPLOY_URL, { method: "POST", body: formData });
    } catch (err) {
      console.error("❌ Error al eliminar ubicación:", err);
    }
  });

  cont.appendChild(item);
}

// Reordenar propuestas (si se quiere usar)
function actualizarNumerosPropuestas() {
  document.querySelectorAll(".ubicacion-item").forEach((item, i) => {
    const label = item.querySelector("b");
    if (label) label.textContent = `Propuesta #${i + 1}`;
  });
}

async function cargarUbicacionesGuardadas(cont) {
  if (!nombreSesionActual) return;
  try {
    const res = await fetch(`${DEPLOY_URL}?action=getUbicaciones&nombreSesion=${encodeURIComponent(nombreSesionActual)}`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.ubicaciones)) {
      data.ubicaciones.forEach((u, i) => agregarUbicacionVisual(u, i + 1));
    }
  } catch (err) {
    console.error("⚠️ Error cargando ubicaciones:", err);
  }
}

// ===================================================
// 📋 SECCIÓN 4 — Pegar y guardar propuestas (versión simplificada)
// ===================================================
window.initSeccion4Propuestas = function () {
  const input = document.getElementById("inputPropuestas");
  const btnProcesar = document.getElementById("btnProcesarPropuestas");
  const lista = document.getElementById("listaPropuestas"); // puedes dejarlo para mostrar el mensaje

  if (!input || !btnProcesar || !lista) return;

  // ================================
  // 🧩 Procesar texto pegado y guardar directamente
  // ================================
  btnProcesar.addEventListener("click", async () => {
    const texto = input.value.trim();
    if (!texto) return alert("⚠️ Pega al menos una propuesta.");

    // Dividir por bloques de "🖼️ Propuesta X"
    const bloques = texto.split(/🖼️\s*Propuesta\s*\d+/i).filter(b => b.trim() !== "");
    const numeros = [...texto.matchAll(/🖼️\s*Propuesta\s*(\d+)/gi)].map(m => parseInt(m[1]));

    if (bloques.length === 0) {
      alert("⚠️ No se encontraron propuestas con el formato correcto.");
      return;
    }

    // Crear objetos de propuestas
    const propuestas = bloques.map((bloque, i) => ({
      NombreSesion: nombreSesionActual,
      NumeroPropuesta: numeros[i] || i + 1,
      Titulo: (bloque.match(/Título:\s*([\s\S]*?)(?=\nDescripción:|$)/i)?.[1] || "").trim(),
      Descripcion: (bloque.match(/Descripción:\s*([\s\S]*?)(?=\nDescripción para Wayfarer:|$)/i)?.[1] || "").trim(),
      Wayfarer: (bloque.match(/Descripción para Wayfarer:\s*([\s\S]*)/i)?.[1] || "").trim()
    }));

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ propuestas, action: "guardarPropuestas" }));

      const res = await fetch(DEPLOY_URL, { method: "POST", body: formData });
      const resultText = await res.text();
      let result;
      try { result = JSON.parse(resultText); } catch { result = { ok: false, mensaje: "Respuesta inválida" }; }

     if (result.ok) {
  // ✅ Mostrar mensaje real del servidor (incluye duplicadas)
  lista.innerHTML = `<div style="background:#0e2239;padding:10px;border-radius:8px;color:#8ff;">
    ${result.mensaje}
  </div>`;

  // ✅ Activar Sección 5 automáticamente
  const seccion5 = document.querySelector("#seccion5");
  if (seccion5) {
    seccion5.style.display = "block";
    const contador = document.querySelector("#contadorPropuestas");
    if (contador) contador.textContent = propuestas.length;
  }
} else {
  alert(`⚠️ Error: ${result.mensaje}`);
}
    } catch (err) {
      console.error("❌ Error al guardar propuestas:", err);
      alert("❌ No se pudo guardar las propuestas.");
    }
  });
};



// ===================================================
// 🧩 SECCIÓN 5 — Generador de Resultados
// ===================================================
window.initSeccion5Resultados = function () {
  const btnGenerar = document.getElementById("btnGenerarPropuestas");
  if (!btnGenerar) return;

  btnGenerar.addEventListener("click", async () => {
    if (!nombreSesionActual) return alert("⚠️ Primero debes seleccionar una sesión.");

    // 🔽 Minimiza todas las secciones
    document.querySelectorAll(".section-content").forEach(c => (c.style.display = "none"));
    document.querySelectorAll(".toggle-btn").forEach(b => (b.textContent = "+"));

    btnGenerar.disabled = true;
    btnGenerar.textContent = "⏳ Generando...";

    const cont = document.getElementById("resultadosContainer");
    const contador = document.getElementById("contadorPropuestas");
    cont.innerHTML = `<p style="color:#8ff;">Cargando datos desde la BD...</p>`;

    try {
      const res = await fetch(`${DEPLOY_URL}?action=getTodoSesion&nombreSesion=${encodeURIComponent(nombreSesionActual)}`);
      const data = await res.json();
      if (!data.ok || !data.registros?.length) {
        cont.innerHTML = "<p style='color:orange;'>⚠️ No hay datos registrados para esta sesión.</p>";
        btnGenerar.disabled = false;
        btnGenerar.textContent = "⚙️ Generar Propuestas";
        return;
      }

      cont.innerHTML = "";
      contador.textContent = `Total de propuestas: ${data.registros.length}`;

      data.registros.forEach((p, i) => {
        const urlFoto = `https://lh3.googleusercontent.com/d/${p.FotoPrincipalID}=s400`;
        const coord = `${p.Lat},${p.Lng}`;
        const mapa = `https://maps.googleapis.com/maps/api/staticmap?center=${coord}&zoom=18&size=200x200&maptype=satellite&markers=color:red%7C${coord}&key=${window.APP_CONFIG.API_KEY}`;

        const card = document.createElement("div");
        card.className = "tarjeta-propuesta";
        card.style.display = "flex";
        card.style.gap = "10px";
        card.style.border = "1px solid #333";
        card.style.borderRadius = "10px";
        card.style.padding = "10px";
        card.style.background = "#0e2239";
        card.style.flexWrap = "wrap";

        card.innerHTML = `
          <div style="flex:1;min-width:150px;text-align:center;">
            <img src="${urlFoto}" style="width:100%;max-width:150px;border-radius:8px;">
          </div>

          <div style="flex:2;min-width:250px;">
            <div style="font-weight:bold;color:#8ff;">#${p.NumeroPropuesta} — ${p.Titulo || "(Sin título)"}</div>
            <div style="margin:6px 0;color:#fff;">${p.Descripcion || "(Sin descripción)"}</div>
            <div style="margin:6px 0;color:#9cf;">${p.Wayfarer || ""}</div>
            ${p.Direccion ? `<div style="font-size:0.9em;color:#aaa;">📍 ${p.Direccion}</div>` : ""}
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
              <button class="secondary copy-btn" data-text="${p.Titulo}">📋 Copiar Título</button>
              <button class="secondary copy-btn" data-text="${p.Descripcion}">📋 Copiar Descripción</button>
              <button class="secondary copy-btn" data-text="${p.Wayfarer}">📋 Copiar WF</button>
            </div>
          </div>

          <div style="flex:1;min-width:180px;text-align:center;">
            <img src="${mapa}" alt="Mapa" style="width:100%;max-width:180px;border-radius:8px;cursor:pointer;">
          </div>

          <div style="width:100%;text-align:right;margin-top:5px;">
            <button class="toggleCard secondary">🔽 Minimizar</button>
          </div>
        `;

        // Copiar texto
        card.querySelectorAll(".copy-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            navigator.clipboard.writeText(btn.dataset.text || "");
            btn.textContent = "✅ Copiado!";
            setTimeout(() => (btn.textContent = "📋 Copiar"), 1000);
          });
        });

        // Mapa clic
        const mapaImg = card.querySelector("img[alt='Mapa']");
        mapaImg.addEventListener("click", () => {
          const iframe = document.getElementById("iframeMapaSat");
          const modal = document.getElementById("modalMapaSat");
          iframe.src = `https://maps.google.com/maps?q=${coord}&t=k&z=18&output=embed`;
          modal.style.display = "flex";
        });

        // Minimizar tarjeta
        const toggleBtn = card.querySelector(".toggleCard");
        toggleBtn.addEventListener("click", () => {
          const contentEls = card.querySelectorAll("div:not(:last-child)");
          const hidden = [...contentEls].some(el => el.style.display === "none");
          contentEls.forEach(el => (el.style.display = hidden ? "" : "none"));
          toggleBtn.textContent = hidden ? "🔽 Minimizar" : "▶️ Mostrar";
        });

        cont.appendChild(card);
      });

    } catch (err) {
      console.error("❌ Error generando propuestas:", err);
      cont.innerHTML = `<p style="color:red;">❌ Error cargando datos.</p>`;
    }

    btnGenerar.disabled = false;
    btnGenerar.textContent = "⚙️ Generar Propuestas";
  });
};

// ✅ Inicializar al cargar la pestaña
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("btnGenerarPropuestas")) {
    window.initSeccion5Resultados();
  }
});


// =========================================================
// 🧪 TEST: Cargar toda la base de datos desde Google Sheets
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnProbarBD");
  const salida = document.getElementById("salidaPruebaBD");

  if (!btn || !salida) return;

  btn.addEventListener("click", async () => {
    salida.textContent = "⏳ Conectando con Google Sheets...";

    try {
      const url = `${SHEET_URL}?action=getAllData`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.ok) {
        salida.textContent = `❌ Error: ${json.mensaje}`;
        return;
      }

      // Mostrar los tres bloques de datos
      const texto = [
        "✅ Conexión y extracción correctas",
        "\n=== 🗂️ SesionesTemporales ===",
        JSON.stringify(json.SesionesTemporales, null, 2),
        "\n=== 📜 HistorialDeSesiones ===",
        JSON.stringify(json.HistorialDeSesiones, null, 2),
        "\n=== 📍 PokeparadasExistentes ===",
        JSON.stringify(json.PokeparadasExistentes, null, 2)
      ].join("\n\n");

      salida.textContent = texto;
      console.log("📦 Datos completos:", json);

    } catch (err) {
      salida.textContent = `❌ Error de conexión o CORS: ${err.message}`;
      console.error("❌ Error al obtener datos:", err);
    }
  });
});
