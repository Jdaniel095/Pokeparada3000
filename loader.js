// ======================
// Cargar secciones externas
// ======================
async function loadSection(id, file, scriptFile) {
  try {
    const res = await fetch(file);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;

    // Cargar JS asociado (si se pasa)
    if (scriptFile) {
      const script = document.createElement("script");
      script.src = scriptFile;
      script.defer = true;
      document.body.appendChild(script);
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
  loadSection("proponer", "proponer.html", "proponer.js");
  loadSection("historial", "historial.html", "historial.js");
});



