// ======================
// Cargar secciones externas
// ======================
async function loadSection(id, file, scriptFiles) {
  try {
    const res = await fetch(file);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;

    // Cargar JS asociados (si se pasa)
    if (scriptFiles) {
      if (!Array.isArray(scriptFiles)) scriptFiles = [scriptFiles];
      scriptFiles.forEach(scriptFile => {
        const script = document.createElement("script");
        script.src = scriptFile;
        script.defer = true;
        document.body.appendChild(script);
      });
    }
  } catch (err) {
    console.error("Error cargando sección:", file, err);
  }
}

// ======================
// Tabs
// ======================
function openTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector(`.tab[onclick="openTab('${tabId}')"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");
}

// ======================
// Inicializar
// ======================
window.addEventListener("DOMContentLoaded", () => {
  // ================= Proponer =================
  loadSection(
    "proponer",
    "proponer.html",
    [
      "js/proponer/seccion1_files.js",
      "js/proponer/seccion2_collage.js",
      "js/proponer/seccion3_locations.js",
      "js/proponer/seccion4_proposals.js",
      "js/proponer/seccion5_results.js"
    ]
  );

  // ================= Historial =================
  loadSection(
    "historial",
    "historial.html",
    "js/historial/historial.js"
  );
});
