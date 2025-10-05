// js/tab1_generate.js
// Inicializador para la pestaña "Generar"
window.initTab1 = function() {
  console.log("🧩 Pestaña Generar iniciada");
  setupToggles();
  setupDriveFunctions();
};

/* =========================
   🟦 TOGGLES DE SECCIONES
========================= */
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

/* =========================
   🟨 SECCIÓN 1: FOTOS DRIVE
========================= */
function setupDriveFunctions() {
  const { API_KEY, DRIVE_FOLDER_ID, SHEET_URL } = window.APP_CONFIG;

  let files = [];
  let selected = new Set();
  let accesoSelected = new Set();

  const testFiles = [
    { id: "test1", name: "Prueba 1", thumbnailLink: "https://wallpapers.com/images/hd/eevee-pictures-9pvgmfx7wz4qeyuj.jpg" },
    { id: "test2", name: "Prueba 2", thumbnailLink: "https://www.shutterstock.com/image-vector/vector-pikachu-on-yellow-background-260nw-2317088997.jpg" },
    { id: "test3", name: "Prueba 3", thumbnailLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SitwRF8aFBgyOkp-K853HhxLSYW8wkecyw&s" },
    { id: "test4", name: "Prueba 4", thumbnailLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZF_P5hyV_zmUTvBU9gtFH2iLrVTLvMamKow&s" }
  ];

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
    cont.innerHTML = "";

    files.forEach((f, i) => {
      const isSel = selected.has(f.id);
      const isAcceso = accesoSelected.has(f.id);
      const thumb = f.thumbnailLink || "";

      const card = document.createElement("div");
      card.classList.add("drive-thumb");

      card.innerHTML = `
        <!-- Check azul -->
        <div class="file-wrapper left">
          <input type="checkbox" id="poke-${f.id}" class="file-toggle" ${isSel ? "checked" : ""}/>
          <label for="poke-${f.id}" class="file-check">✓</label>
        </div>

        <!-- Check naranja -->
        <div class="file-wrapper right">
          <input type="checkbox" id="acceso-${f.id}" class="file-toggle" ${isAcceso ? "checked" : ""}/>
          <label for="acceso-${f.id}" class="file-check acceso">✓</label>
        </div>

        <!-- Imagen -->
        <img src="${thumb}" alt="${f.name}">

        <!-- Número -->
        <div class="thumb-num">#${i + 1}</div>
      `;

      // Eventos de los checks
      card.querySelector(`#poke-${f.id}`).addEventListener("change", (e) => {
        if (e.target.checked) {
          selected.add(f.id);
          accesoSelected.delete(f.id);
        } else {
          selected.delete(f.id);
        }
        renderFiles();
      });

      card.querySelector(`#acceso-${f.id}`).addEventListener("change", (e) => {
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

    // Contadores
    const spans = document.querySelectorAll("#filesCounter span");
    if (spans.length >= 3) {
      spans[0].textContent = `Total: ${files.length}`;
      spans[1].textContent = `Poképaradas: ${selected.size}`;
      spans[2].textContent = `Accesos: ${accesoSelected.size}`;
    }
  }

  // === Botones ===
  document.getElementById("btnRefresh").onclick = listDriveFiles;
  document.getElementById("btnSelectAll").onclick = () => {
    files.forEach(f => selected.add(f.id));
    renderFiles();
  };
  document.getElementById("btnClearPoke").onclick = () => {
    selected.clear(); renderFiles();
  };
  document.getElementById("btnClearAcceso").onclick = () => {
    accesoSelected.clear(); renderFiles();
  };
  document.getElementById("btnClearAll").onclick = () => {
    selected.clear(); accesoSelected.clear(); renderFiles();
  };

  // === Guardar en Google Sheets ===
document.getElementById("btnGuardarFotos").onclick = async () => {
  const pokes = Array.from(selected);
  const accesos = Array.from(accesoSelected);
  const pares = pokes.map((p, i) => ({
    FotoPrincipalID: p,
    FotoAccesoID: accesos[i] || ""
  }));

  console.table(pares);

  try {
    const res = await fetch(window.APP_CONFIG.SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pares })
    });

    const resultText = await res.text();
    console.log("📩 Respuesta de Sheets:", resultText);

    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { ok: false, error: "Respuesta no válida del servidor" };
    }

    if (result.ok) {
      alert(`✅ Guardado exitoso:\n• Nuevos: ${result.added || 0}`);
    } else {
      alert(`⚠️ Error al guardar: ${result.error}`);
    }
  } catch (err) {
    console.error("❌ Error al enviar a Sheets:", err);
    alert("❌ No se pudo conectar al servidor de Google Sheets.");
  }
};
  // 🚀 Cargar automáticamente las imágenes
  listDriveFiles();
}
