// js/tab2_manage.js
// Pestaña "Gestionar"
(function () {
  console.log("tab2_manage.js cargado");

  // DEPLOY URL (debe estar en window.APP_CONFIG.SHEET_URL como en tab1)
  const DEPLOY_URL = window.APP_CONFIG && window.APP_CONFIG.SHEET_URL;
  if (!DEPLOY_URL) console.warn("⚠️ window.APP_CONFIG.SHEET_URL no definido. Asegúrate en config.js");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const formContainer = document.getElementById("formContainer");
    const btnOpcionModificacion = document.getElementById("btnOpcionModificacion");
    const btnOpcionPropuesta = document.getElementById("btnOpcionPropuesta");
    const btnBuscar = document.getElementById("btnBuscar");
    const inputBuscar = document.getElementById("inputBuscar");
    const resultadoBusqueda = document.getElementById("resultadoBusqueda");
    const modalMapa = document.getElementById("modalMapa");
    const btnCerrarMapa = document.getElementById("btnCerrarMapa");
    let leafletMap = null;

    // Mostrar formularios
    btnOpcionModificacion.addEventListener("click", () => {
      formContainer.innerHTML = plantillaModificacion();
      document.getElementById("btnGuardarMod").addEventListener("click", guardarModificacion);
    });

    btnOpcionPropuesta.addEventListener("click", () => {
      formContainer.innerHTML = plantillaPropuesta();
      document.getElementById("btnGuardarProp").addEventListener("click", guardarPropuesta);
    });

    // Buscar
    btnBuscar.addEventListener("click", () => {
      const texto = inputBuscar.value.trim();
      if (!texto) return alert("Escribe un título para buscar.");
      buscarWayfarer(texto);
    });

    // Cerrar mapa
    btnCerrarMapa.addEventListener("click", () => {
      closeMapa();
    });

    // Plantillas HTML
    function plantillaModificacion() {
      return `
        <h3>🛠️ Agregar Modificación</h3>
        <label>Título:</label><input id="titulo" type="text" style="width:100%;margin-bottom:6px;">
        <label>Coordenada Actual (lat,lng):</label><input id="coorActual" type="text" style="width:100%;margin-bottom:6px;">
        <label>Coordenada Modificada (lat,lng):</label><input id="coorModificada" type="text" style="width:100%;margin-bottom:6px;">
        <label>Estado:</label>
        <select id="estado" style="width:100%;margin-bottom:6px;">
          <option value="En cola">En cola</option>
          <option value="En votación">En votación</option>
          <option value="Aceptada">Aceptada</option>
        </select>
        <label>Imagen Poképarada (URL):</label><input id="img" type="text" style="width:100%;margin-bottom:6px;">
        <label>Nombre para editar:</label><input id="nombre" type="text" style="width:100%;margin-bottom:10px;">
        <button id="btnGuardarMod" class="primary">💾 Guardar Modificación</button>
      `;
    }

    function plantillaPropuesta() {
      return `
        <h3>✨ Agregar Propuesta</h3>
        <label>Título:</label><input id="titulo" type="text" style="width:100%;margin-bottom:6px;">
        <label>Imagen Poképarada (URL):</label><input id="img" type="text" style="width:100%;margin-bottom:6px;">
        <label>Nombre para editar:</label><input id="nombre" type="text" style="width:100%;margin-bottom:10px;">
        <button id="btnGuardarProp" class="primary">💾 Guardar Propuesta</button>
      `;
    }

    // Guardar Modificación -> POST a DEPLOY_URL
    async function guardarModificacion() {
      const payload = {
        tipo: "modificacion",
        titulo: (document.getElementById("titulo") || {}).value || "",
        coorActual: (document.getElementById("coorActual") || {}).value || "",
        coorModificada: (document.getElementById("coorModificada") || {}).value || "",
        estado: (document.getElementById("estado") || {}).value || "",
        img: (document.getElementById("img") || {}).value || "",
        nombre: (document.getElementById("nombre") || {}).value || ""
      };
      if (!payload.titulo || !payload.nombre) return alert("Completa los campos Título y Nombre para editar.");

      try {
        await postToApi({ action: "guardarWayfarer", payload });
        alert("✅ Modificación guardada.");
        formContainer.innerHTML = "";
      } catch (err) {
        console.error(err);
        alert("❌ Error guardando modificación. Mira consola network/console.");
      }
    }

    // Guardar Propuesta
    async function guardarPropuesta() {
      const payload = {
        tipo: "propuesta",
        titulo: (document.getElementById("titulo") || {}).value || "",
        img: (document.getElementById("img") || {}).value || "",
        nombre: (document.getElementById("nombre") || {}).value || ""
      };
      if (!payload.titulo || !payload.nombre) return alert("Completa los campos Título y Nombre para editar.");

      try {
        await postToApi({ action: "guardarWayfarer", payload });
        alert("✅ Propuesta guardada.");
        formContainer.innerHTML = "";
      } catch (err) {
        console.error(err);
        alert("❌ Error guardando propuesta. Mira consola network/console.");
      }
    }

    // POST helper (envía FormData como en tab1)
    async function postToApi(obj) {
      if (!DEPLOY_URL) throw new Error("DEPLOY_URL no definido");
      const formData = new FormData();
      formData.append("data", JSON.stringify(obj));
      const r = await fetch(DEPLOY_URL, { method: "POST", body: formData });
      if (!r.ok) throw new Error("Error HTTP " + r.status);
      const json = await r.json();
      if (!json.ok) throw new Error(JSON.stringify(json));
      return json;
    }

    // Buscar Wayfarer (GET)
    async function buscarWayfarer(texto) {
      if (!DEPLOY_URL) {
        alert("DEPLOY_URL no definido. Revisa config.");
        return;
      }
      try {
        const url = `${DEPLOY_URL}?action=buscarWayfarer&titulo=${encodeURIComponent(texto)}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        if (!data.ok) {
          resultadoBusqueda.innerHTML = `<p style="color:#a00">Error servidor: ${data.message || 'unknown'}</p>`;
          return;
        }
        mostrarResultados(data.results || []);
      } catch (err) {
        console.error(err);
        resultadoBusqueda.innerHTML = `<p style="color:#a00">Error buscando. Revisa consola.</p>`;
      }
    }

    // Mostrar resultados
    function mostrarResultados(lista) {
      if (!lista || lista.length === 0) {
        resultadoBusqueda.innerHTML = `<p style="color:#aaa;">No se encontró ninguna poképarada.</p>`;
        return;
      }

      resultadoBusqueda.innerHTML = "";
      lista.forEach(u => {
        const card = document.createElement("div");
        card.style.background = "#112233";
        card.style.color = "#fff";
        card.style.borderRadius = "8px";
        card.style.padding = "10px";
        card.style.marginBottom = "10px";

        const title = u["Nombrepropuesta"] || u["NombrePropuesta"] || u["titulo"] || "";
        const estado = u["Estado"] || "";
        const coorActual = u["CoorActual"] || u["Cooractual"] || "";
        const coorModificada = u["CoorModificada"] || u["Coormodificada"] || "";

        card.innerHTML = `
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="flex:1">
              <strong style="font-size:16px">${escapeHtml(title)}</strong>
              <div style="font-size:13px;margin-top:6px;color:#ddd"><b>Estado:</b> ${escapeHtml(estado)}</div>
              <div style="font-size:13px;margin-top:4px;color:#ccc"><b>Coordenadas:</b> ${escapeHtml(coorActual)} ${coorModificada ? "→ " + escapeHtml(coorModificada) : ""}</div>
            </div>
            <div style="width:120px;text-align:right">
              ${u["img"] ? `<img src="${u["img"]}" style="width:110px;height:70px;object-fit:cover;border-radius:6px;">` : ""}
            </div>
          </div>
        `;

        if (coorActual && coorModificada) {
          const btn = document.createElement("button");
          btn.textContent = "🗺️ Ver movimiento";
          btn.style.marginTop = "8px";
          btn.className = "secondary";
          btn.onclick = () => verMapa(coorActual, coorModificada);
          card.appendChild(btn);
        }

        resultadoBusqueda.appendChild(card);
      });
    }

    // mostrar mapa con Leaflet (dos puntos)
    function verMapa(coorActual, coorModificada) {
      const parse = s => {
        if (!s) return null;
        const parts = s.toString().split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length < 2) return null;
        return [parseFloat(parts[0]), parseFloat(parts[1])];
      };

      const p1 = parse(coorActual);
      const p2 = parse(coorModificada);
      if (!p1) return alert("Coord. actual inválida");
      if (!p2) return alert("Coord. modificada inválida");

      // show modal
      modalMapa.style.display = "flex";

      // limpiar contenedor
      const container = document.getElementById("tab2LeafletMap");
      container.innerHTML = "";

      // remover mapa previo
      if (leafletMap) {
        try { leafletMap.remove(); } catch (e) { /* ignore */ }
        leafletMap = null;
      }

      // crear mapa
      leafletMap = L.map(container, { zoomControl: true, attributionControl: false }).setView(p1, 17);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles © Esri'
      }).addTo(leafletMap);

      const redIcon = L.circleMarker(p1, { radius: 8, color: 'red', fillColor: 'red', fillOpacity: 0.9 }).addTo(leafletMap);
      const greenIcon = L.circleMarker(p2, { radius: 8, color: 'green', fillColor: 'green', fillOpacity: 0.9 }).addTo(leafletMap);

      // linea entre puntos
      L.polyline([p1, p2], { color: '#fff', weight: 2, opacity: 0.7 }).addTo(leafletMap);

      const bounds = L.latLngBounds([p1, p2]);
      leafletMap.fitBounds(bounds.pad(0.4));
      setTimeout(() => { try { leafletMap.invalidateSize(); } catch (e) {} }, 200);
    }

    function closeMapa() {
      if (leafletMap) {
        try { leafletMap.remove(); } catch (e) {}
        leafletMap = null;
      }
      modalMapa.style.display = "none";
    }

    // escape simple
    function escapeHtml(s) {
      return String(s || "").replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]);
    }
  } // init end
})();
