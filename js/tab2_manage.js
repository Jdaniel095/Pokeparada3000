// js/tab2_manage.js — Versión Optimizada (Masivo Inline + Modal Maps) 
// === PARTE 1/4 ===

window.initTab2 = function () {

  // -----------------------------
  // Variables Globales
  // -----------------------------
  let map;
  let originalMarker;
  let newMarker;
  let geocoder;
  let googleMapsScriptLoaded = false;
  let propuestasCache = new Map();   // idFila (número de fila) -> objeto propuesta
  let editContext = { idFila: null }; // para saber qué fila estamos editando desde el modal

  const DEPLOY_URL = window.APP_CONFIG?.SHEET_URL;
  const API_KEY = window.APP_CONFIG?.API_KEY;

  if (!DEPLOY_URL) {
    console.error("❌ APP_CONFIG.SHEET_URL no definido");
  }
  if (!API_KEY) {
    console.error("❌ APP_CONFIG.API_KEY no definido");
  }

  // -----------------------------
  // Util: Parsear "lat, lng" a objeto {lat, lng}
  // -----------------------------
  function parseCoords(coordString) {
    if (!coordString) return null;
    const parts = coordString.split(",");
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  }

  // -----------------------------
  // Cargar Google Maps JS API (una sola vez)
  // -----------------------------
  function loadGoogleMapsApi(callback) {
    if (googleMapsScriptLoaded) {
      if (callback) callback();
      return;
    }
    if (!API_KEY) {
      alert("Error de configuración: falta API_KEY de Google Maps.");
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsScriptLoaded = true;
      geocoder = new google.maps.Geocoder();
      if (callback) callback();
    };
    script.onerror = () => {
      console.error("❌ Error al cargar Google Maps JS.");
      alert("No se pudo cargar Google Maps.");
    };
    document.head.appendChild(script);
  }

  // -----------------------------
  // Inicializar Mapa (Modal grande)
  // -----------------------------
  function initMap(originalCoordsStr, reubicacionCoordsStr) {
    const mapCanvas = document.getElementById("map-canvas");
    if (!mapCanvas) return;

    if (!googleMapsScriptLoaded) {
      loadGoogleMapsApi(() => initMap(originalCoordsStr, reubicacionCoordsStr));
      return;
    }

    // Limpiar marcadores previos
    if (originalMarker) originalMarker.setMap(null);
    if (newMarker) newMarker.setMap(null);
    originalMarker = null;
    newMarker = null;

    const originalCoords = parseCoords(originalCoordsStr);
    const reubCoords = parseCoords(reubicacionCoordsStr);
    const centerCoords =
      reubCoords || originalCoords || { lat: -11.964658, lng: -77.061995 };

    map = new google.maps.Map(mapCanvas, {
      center: centerCoords,
      zoom: 17,
      mapTypeId: "hybrid",
      disableDefaultUI: true,
      gestureHandling: "greedy",
      zoomControl: false,
      fullscreenControl: true,
      mapTypeControl: false,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
        { featureType: "landscape.man_made", stylers: [{ visibility: "off" }] }
      ]
    });

    // Marcador original (naranja)
    if (originalCoords) {
      originalMarker = new google.maps.Marker({
        position: originalCoords,
        map,
        icon: "https://wayfarer.nianticlabs.com/imgpub/marker-orange-transparent-64.png",
        title: "Ubicación original"
      });
    }

    // Marcador reubicado (verde)
    if (reubCoords) {
      newMarker = new google.maps.Marker({
        position: reubCoords,
        map,
        icon: "https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png",
        title: "Nueva ubicación",
        draggable: true
      });
    }

    // Click sobre el mapa => crear/mover marcador verde
    map.addListener("click", (e) => {
      const pos = e.latLng;
      if (!newMarker) {
        newMarker = new google.maps.Marker({
          position: pos,
          map,
          icon: "https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png",
          title: "Nueva ubicación",
          draggable: true
        });
      } else {
        newMarker.setPosition(pos);
      }
    });
  }

  // -----------------------------
  // Mapa Miniatura (Modal para tarjetas)
  // -----------------------------
  function initMapMiniatura(originalCoordsStr, reubicacionCoordsStr) {
    const mapCanvas = document.getElementById("map-canvas-miniatura");
    if (!mapCanvas) return;

    if (!googleMapsScriptLoaded) {
      loadGoogleMapsApi(() =>
        initMapMiniatura(originalCoordsStr, reubicacionCoordsStr)
      );
      return;
    }

    if (originalMarker) originalMarker.setMap(null);
    if (newMarker) newMarker.setMap(null);
    originalMarker = null;
    newMarker = null;

    const originalCoords = parseCoords(originalCoordsStr);
    const reubCoords = parseCoords(reubicacionCoordsStr);
    const centerCoords =
      reubCoords || originalCoords || { lat: -12.046374, lng: -77.042793 };

    map = new google.maps.Map(mapCanvas, {
      center: centerCoords,
      zoom: 18,
      mapTypeId: "satellite",
      disableDefaultUI: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ visibility: "off" }] }
      ]
    });

    if (originalCoords) {
      new google.maps.Marker({
        position: originalCoords,
        map,
        icon: "https://wayfarer.nianticlabs.com/imgpub/marker-orange-transparent-64.png",
        title: "Ubicación"
      });
    }
    if (reubCoords) {
      new google.maps.Marker({
        position: reubCoords,
        map,
        icon: "https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png",
        title: "Ubicación Alterna"
      });
    }
  }
// === PARTE 2/4 ===

  // -----------------------------
  // Geocoding (mejora distritos comunes en Lima Norte)
  // -----------------------------
  async function fetchGeocode(coordInput) {
    if (!geocoder) {
      loadGoogleMapsApi(() => fetchGeocode(coordInput));
      return;
    }
    const coords = parseCoords(coordInput.value);
    if (!coords) return;

    const inputId = coordInput.id;
    let hiddenId = "";
    if (inputId === "nueva-coordenadas") hiddenId = "nueva-direccion";
    else if (inputId === "mover-coor-actual") hiddenId = "mover-direccion";
    else if (inputId === "nueva-coordenadas-reu") hiddenId = "nueva-direccion"; // reuso
    else return;

    const hidden = document.getElementById(hiddenId);
    if (!hidden) return;

    try {
      const resp = await geocoder.geocode({ location: coords });
      if (!resp.results || !resp.results[0]) {
        hidden.value = "Dirección no encontrada";
        return;
      }
      const comp = resp.results[0].address_components;

      const numero = comp.find((c) => c.types.includes("street_number"))?.long_name || "";
      const calle = comp.find((c) => c.types.includes("route"))?.long_name || "";
      let distrito =
        comp.find((c) => c.types.includes("locality"))?.long_name ||
        comp.find((c) => c.types.includes("administrative_area_level_3"))?.long_name ||
        "";
      let provincia = comp.find((c) => c.types.includes("administrative_area_level_2"))?.long_name || "";
      const pais = comp.find((c) => c.types.includes("country"))?.long_name || "";

      if (distrito) distrito = distrito.replace(/^Distrito de\s*/i, "").trim();
      if (provincia) provincia = provincia.replace(/^Provincia de\s*/i, "").trim();

      // Correcciones típicas Lima Norte
      if (distrito === "Lima" || distrito === "Distrito de Lima") {
        if (coords.lat < -11.9 && coords.lat > -12.05) {
          if (coords.lng < -77.05) distrito = "Comas";
          else if (coords.lng < -77.03) distrito = "Los Olivos";
          else distrito = "San Martín de Porres";
        } else if (coords.lat < -12.0) {
          distrito = "Lima";
        }
      }
      if (provincia && distrito && provincia.toLowerCase() === distrito.toLowerCase()) provincia = "";

      const direccionCustom = [
        calle ? `${calle}${numero ? " " + numero : ""}` : "",
        distrito,
        provincia ? provincia : "",
        pais ? `- ${pais}` : ""
      ]
        .filter(Boolean)
        .join(", ")
        .replace(/,\s-,/g, "-")
        .replace(/\s{2,}/g, " ")
        .trim();

      hidden.value = direccionCustom;
    } catch (err) {
      console.error("Error de Geocoding:", err);
      hidden.value = "Error de Geocoding";
    }
  }

  // -----------------------------
  // Pintar tarjetas desde la hoja
  // -----------------------------
  async function cargarTarjetas() {
    const cont = document.getElementById("gestion-lista-tarjetas");
    if (!cont) return;
    cont.innerHTML = `<p style="text-align:center;color:#ecf0f1;font-size:1.1rem;">Cargando propuestas... 🤖</p>`;

    try {
      const res = await fetch(`${DEPLOY_URL}?action=getWayfarerPropuestas`);
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.propuestas)) {
        throw new Error(data.mensaje || "No se pudieron cargar los datos");
      }
      if (data.propuestas.length === 0) {
        cont.innerHTML = `<p style="text-align:center;color:#ecf0f1;">No hay propuestas activas.</p>`;
        return;
      }

let html = "";
propuestasCache = new Map(); // reiniciamos cache

data.propuestas.forEach((p) => {
  // Guardar en cache para editar
  propuestasCache.set(p.id, p);

  // Tipo desde hoja (clasificado)
  const clas = (p.clasificado || "").trim();

  let tipoTag = "";
  if (clas === "Movimiento de Pokeparada") {
    tipoTag = `<span class="prop-tag tag-mover tag-tipo-propuesta">Movimiento de Pokeparada</span>`;
  } else if (clas === "Propuesta con Reubicación") {
    tipoTag = `<span class="prop-tag tag-reubicada tag-tipo-propuesta">Propuesta con Reubicación</span>`;
  } else {
    tipoTag = `<span class="prop-tag tag-nueva tag-tipo-propuesta">Propuesta de Pokeparada</span>`;
  }

  // Estado visual + etiqueta (ahora incluye Aceptada / Rechazada)
  let estadoTag = "";
  if (p.estado === "En Votacion") {
    estadoTag = `<span class="prop-tag estado-votacion">En Votación</span>`;
  } else if (p.estado === "En Cola") {
    estadoTag = `<span class="prop-tag estado-cola">En Cola</span>`;
  } else if (p.estado === "Aceptada") {
    estadoTag = `<span class="prop-tag estado-aceptada">Aceptada</span>`;
  } else if (p.estado === "Rechazada") {
    estadoTag = `<span class="prop-tag estado-rechazada">Rechazada</span>`;
  } else {
    estadoTag = `<span class="prop-tag estado-cola">${p.estado || "En Cola"}</span>`;
  }

  // Ubicación
  const tienePar = p.coorActual && p.coorModificada;
  let ubicacionHtml = `<p><b>Dirección:</b> <span>${p.direccion || "(No disponible)"}</span></p>`;
  if (tienePar) {
    ubicacionHtml += `
      <p><b>Original (Rojo):</b> <span>${p.coorActual}</span></p>
      <p><b>Modificada (Verde):</b> <span>${p.coorModificada}</span></p>
    `;
  } else {
    ubicacionHtml += `<p><b>Coordenadas:</b> <span>${p.coorActual || "-"}</span></p>`;
  }

  // Static Map con auto-zoom
  let mapaUrl = `https://maps.googleapis.com/maps/api/staticmap?size=360x300&scale=2&maptype=satellite&key=${API_KEY}`;
  if (tienePar) {
    mapaUrl +=
      `&visible=${p.coorActual}|${p.coorModificada}` +
      `&markers=icon:https://wayfarer.nianticlabs.com/imgpub/marker-orange-transparent-64.png%7C${p.coorActual}` +
      `&markers=icon:https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png%7C${p.coorModificada}`;
  } else if (p.coorActual) {
    mapaUrl += `&zoom=18&markers=icon:https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png%7C${p.coorActual}`;
  } else {
    mapaUrl = "assets/map_placeholder.jpg";
  }

  // Imagen principal
  const imgUrl =
    p.img && p.img.startsWith("http")
      ? p.img
      : p.img
      ? `https://lh3.googleusercontent.com/${p.img}=s400`
      : "assets/map_placeholder.jpg";

  // Clase por estado (borde verde/rojo)
  const estadoClase =
    p.estado === "Aceptada" ? "accepted"
    : p.estado === "Rechazada" ? "rejected"
    : "";

  html += `
    <article class="gestion-card ${estadoClase}" data-id-fila="${p.id}">
      <div class="imagen-area">
        <img src="${imgUrl}" alt="Imagen propuesta" class="imagen-principal">
        <button class="btn-editar-propuesta" data-id="${p.id}">Editar</button>
        ${tipoTag}
      </div>
      <div class="contenido">
        <span class="prop-titulo">${p.titulo || "-"}</span>
        <div class="tag-container">${estadoTag}</div>
        <div class="ubicacion">${ubicacionHtml}</div>
      </div>
      <div class="mapa">
        <img src="${mapaUrl}" alt="Mini-mapa" class="mapa-miniatura"
             data-coor-actual="${p.coorActual || ""}"
             data-coor-modificada="${p.coorModificada || ""}"
             style="width:100%;height:100%;object-fit:cover;border-radius:0 12px 12px 0;cursor:pointer;">
      </div>
    </article>
  `;
});

cont.innerHTML = html;

    } catch (err) {
      console.error("❌ Error al cargar tarjetas:", err);
      cont.innerHTML = `<p style="text-align:center;color:#e74c3c;">Error al cargar propuestas: ${err.message}</p>`;
    }
  }

  // -----------------------------
  // Helpers UI
  // -----------------------------
  function setVisible(el, show) {
    if (!el) return;
    el.style.display = show ? "block" : "none";
  }
  function setFlex(el, show) {
    if (!el) return;
    el.style.display = show ? "flex" : "none";
  }
// ✅ Nueva función: limpiar lista masiva (puede mantener o apagar el modo)
function limpiarListaMasiva(apagar = false) {
  propuestasMasivasInline = [];
  actualizarListaMasivaInline?.();

  const check = document.getElementById("activar-masivo");
  const bloque = document.getElementById("bloque-masivo-inline");
  const btnGuardar = document.getElementById("btn-guardar-propuesta");

  if (!check || !bloque || !btnGuardar) return;

  if (apagar) {
    check.checked = false;
    btnGuardar.textContent = "Subir Propuesta";
    setVisible(bloque, false);
  } else {
    // Mantener modo masivo activo pero sin elementos
    if (check.checked) {
      btnGuardar.textContent = "➕ Agregar a lista";
      setVisible(bloque, true);
    } else {
      btnGuardar.textContent = "Subir Propuesta";
      setVisible(bloque, false);
    }
  }
}


  // -----------------------------
  // Validar según tipo actual
  // -----------------------------
  function validarFormularioActual() {
    const tipo = document.getElementById("tipo-propuesta-select").value;
    const nombre = document.getElementById("gestion-nombre").value.trim();
    if (!nombre) {
      alert('El campo "Tu Nick (Wayfarer/PoGo)" no puede estar vacío.');
      document.getElementById("gestion-nombre").focus();
      return false;
    }

    if (tipo === "nueva") {
      const t = document.getElementById("nueva-titulo").value.trim();
      if (!t) {
        alert('El campo "Título" no puede estar vacío.');
        document.getElementById("nueva-titulo").focus();
        return false;
      }
    }

    if (tipo === "reubicacion") {
      const t = document.getElementById("nueva-titulo-reu").value.trim();
      const c0 = document.getElementById("nueva-coordenadas-reu").value.trim();
      if (!t) {
        alert('El campo "Título" no puede estar vacío.');
        document.getElementById("nueva-titulo-reu").focus();
        return false;
      }
      if (!c0) {
        alert('El campo "Coordenadas Iniciales" no puede estar vacío.');
        document.getElementById("nueva-coordenadas-reu").focus();
        return false;
      }
    }

    if (tipo === "mover") {
      const t = document.getElementById("mover-titulo").value.trim();
      const cA = document.getElementById("mover-coor-actual").value.trim();
      const cM = document.getElementById("mover-coor-modificada").value.trim();
      if (!t) {
        alert('El campo "Título" no puede estar vacío.');
        document.getElementById("mover-titulo").focus();
        return false;
      }
      if (!cA) {
        alert('El campo "Coordenada Actual" no puede estar vacío.');
        document.getElementById("mover-coor-actual").focus();
        return false;
      }
      if (!cM) {
        alert('El campo "Coordenada Modificada" no puede estar vacío.');
        document.getElementById("mover-coor-modificada").focus();
        return false;
      }
    }
    return true;
  }

  // -----------------------------
  // Armar payload según tipo actual (para enviar a GAS)
  // -----------------------------
  function obtenerDatosFormularioActual() {
    const tipo = document.getElementById("tipo-propuesta-select").value;
    const estado = document.getElementById("gestion-estado").value;
    const nombre = document.getElementById("gestion-nombre").value.trim();

    const datos = {
      action: "guardarWayfarer",
      tipo,
      estado,
      nombre,
      fecha: new Date().toISOString()
    };

    if (tipo === "nueva") {
      datos.titulo = document.getElementById("nueva-titulo").value.trim();
      datos.coorActual = document.getElementById("nueva-coordenadas").value.trim();
      datos.coorModificada = ""; // en "nueva" no hay reubicación a menos que agregues flujo
      datos.direccion = document.getElementById("nueva-direccion").value || "";
      let img = document.getElementById("nueva-img").value.trim();
      if (img && img.includes("googleusercontent.com/")) {
        const parts = img.split("/");
        img = parts[parts.length - 1].split("=")[0];
      }
      datos.img = img;
    }

    if (tipo === "reubicacion") {
      datos.titulo = document.getElementById("nueva-titulo-reu").value.trim();
      datos.coorActual = document.getElementById("nueva-coordenadas-reu").value.trim();
      datos.coorModificada =
        document.getElementById("nueva-coordenadas-reubicadas-reu").value.trim() || "";
      datos.direccion = document.getElementById("nueva-direccion").value || "";
      let img = document.getElementById("nueva-img-reu").value.trim();
      if (img && img.includes("googleusercontent.com/")) {
        const parts = img.split("/");
        img = parts[parts.length - 1].split("=")[0];
      }
      datos.img = img;
    }

    if (tipo === "mover") {
      datos.titulo = document.getElementById("mover-titulo").value.trim();
      datos.coorActual = document.getElementById("mover-coor-actual").value.trim();
      datos.coorModificada = document.getElementById("mover-coor-modificada").value.trim();
      datos.direccion = document.getElementById("mover-direccion").value || "";
      let img = document.getElementById("mover-img").value.trim();
      if (img && img.includes("googleusercontent.com/")) {
        const parts = img.split("/");
        img = parts[parts.length - 1].split("=")[0];
      }
      datos.img = img;
    }


    // === Clasificación fija que se guardará en la hoja (columna "Clasificado")
const mapaClasificado = {
  nueva: "Propuesta de Pokeparada",
  reubicacion: "Propuesta con Reubicación",
  mover: "Movimiento de Pokeparada"
};
datos.tipoClasificado = mapaClasificado[tipo] || "Propuesta de Pokeparada";


    return datos;
  }

  // -----------------------------
  // Enviar UNA propuesta (modo normal)
  // -----------------------------
  async function enviarPropuestaActual(btn) {
    if (!validarFormularioActual()) return;
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = "Guardando... ⏳";

    try {
      const datos = obtenerDatosFormularioActual();
      const fd = new FormData();
      fd.append("data", JSON.stringify(datos));
      const res = await fetch(DEPLOY_URL, { method: "POST", body: fd });
      const out = await res.json();
      if (!out.ok) throw new Error(out.mensaje || "Error en el servidor");
     alert(out.mensaje || "✅ ¡Propuesta guardada con éxito!");
limpiarSoloCamposFormulario();     // Limpia los campos del formulario actual
limpiarListaMasiva(true);          // Vacía lista y APAGA modo masivo si estaba on
cargarTarjetas();                  // Refresca tarjetas

    } catch (err) {
      alert("❌ Error al guardar: " + err.message);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  }

// ✅ Limpia solo los campos del formulario actual (NO borra Estado, Nick, Tipo)
function limpiarSoloCamposFormulario() {
  const tipo = document.getElementById("tipo-propuesta-select").value;

  if (tipo === "nueva") {
    document.getElementById("nueva-titulo").value = "";
    document.getElementById("nueva-coordenadas").value = "";
    document.getElementById("nueva-img").value = "";
    document.getElementById("nueva-direccion").value = "";
  }

  if (tipo === "reubicacion") {
    document.getElementById("nueva-titulo-reu").value = "";
    document.getElementById("nueva-coordenadas-reu").value = "";
    document.getElementById("nueva-img-reu").value = "";
    document.getElementById("nueva-coordenadas-reubicadas-reu").value = "";
  }

  if (tipo === "mover") {
    document.getElementById("mover-titulo").value = "";
    document.getElementById("mover-img").value = "";
    document.getElementById("mover-coor-actual").value = "";
    document.getElementById("mover-coor-modificada").value = "";
  }

  
}
  // -----------------------------
  // Buscador en tarjetas
  // -----------------------------
  (function initBuscador() {
  const buscador = document.getElementById("buscador-propuesta");
  if (!buscador) return;

  buscador.addEventListener("input", function () {
    const texto = this.value.trim().toLowerCase();

    // ✅ 1. Filtrar tarjetas
    document.querySelectorAll(".gestion-card").forEach((card) => {
      const titulo = card.querySelector(".prop-titulo")?.textContent.toLowerCase() || "";
      const ubic = card.querySelector(".ubicacion")?.textContent.toLowerCase() || "";
      const estado = card.querySelector(".tag-container")?.textContent.toLowerCase() || "";
      card.style.display =
        titulo.includes(texto) || ubic.includes(texto) || estado.includes(texto)
          ? ""
          : "none";
    });

    // ✅ 2. Si el formulario está abierto → se cierra automáticamente
    const toggleBtn = document.querySelector("#form-gestion-card .toggle-btn");
    const content = document.querySelector("#form-gestion-content");
    if (content && toggleBtn && content.style.display !== "none") {
      content.style.display = "none";   // lo oculta
      toggleBtn.textContent = "+";      // cambia el botón
    }
  });
})();


  // -----------------------------
  // Modo Carga Masiva Inline
  // -----------------------------
  let propuestasMasivasInline = [];
  const checkMasivo = document.getElementById("activar-masivo");
  const bloqueMasivo = document.getElementById("bloque-masivo-inline");
  const btnGuardar = document.getElementById("btn-guardar-propuesta");
  const contadorInline = document.getElementById("contador-masiva-inline");
  const listaInline = document.getElementById("lista-propuestas-inline");
  const btnGuardarTodasInline = document.getElementById("btn-guardar-todas-inline");

  // Cambiar modo al activar/desactivar el check
  if (checkMasivo) {
    checkMasivo.addEventListener("change", () => {
      if (checkMasivo.checked) {
        btnGuardar.textContent = "➕ Agregar a lista";
        setVisible(bloqueMasivo, true);
      } else {
        btnGuardar.textContent = "Subir Propuesta";
        setVisible(bloqueMasivo, false);
        propuestasMasivasInline = [];
        actualizarListaMasivaInline();
      }
    });
  }

  // Si estoy en modo masivo, el botón principal agrega a la lista
  if (btnGuardar) {
    btnGuardar.addEventListener("click", async (ev) => {
      if (!checkMasivo?.checked) {
        // modo normal => guardar
        await enviarPropuestaActual(ev.currentTarget);
        return;
      }

      // modo masivo => agregar a lista
      const tipo = document.getElementById("tipo-propuesta-select").value;
      let titulo = "", coords = "", img = "";

      if (tipo === "nueva") {
        titulo = document.getElementById("nueva-titulo").value.trim();
        coords = document.getElementById("nueva-coordenadas").value.trim();
        img = document.getElementById("nueva-img").value.trim();
  } else if (tipo === "reubicacion") {
  titulo = document.getElementById("nueva-titulo-reu").value.trim();
  coords = {
    original: document.getElementById("nueva-coordenadas-reu").value.trim(),
    nueva: document.getElementById("nueva-coordenadas-reubicadas-reu").value.trim()
  };
  img = document.getElementById("nueva-img-reu").value.trim();

      } else {
  // mover
  titulo = document.getElementById("mover-titulo").value.trim();
  coords = {
    original: document.getElementById("mover-coor-actual").value.trim(),
    nueva: document.getElementById("mover-coor-modificada").value.trim()
  };
  img = document.getElementById("mover-img").value.trim();
}

let direccion = "";
if (tipo === "nueva" || tipo === "reubicacion") {
  direccion = document.getElementById("nueva-direccion").value.trim();
} else if (tipo === "mover") {
  direccion = document.getElementById("mover-direccion").value.trim();
}

// Validaciones
if (!titulo) {
  alert("⚠️ El Título es obligatorio.");
  return;
}
if (tipo === "nueva" && !coords) {
  alert("⚠️ Las coordenadas son obligatorias.");
  return;
}
if (tipo === "reubicacion" && !coords.original) {
  alert("⚠️ La coordenada inicial es obligatoria en reubicación.");
  return;
}
if (tipo === "mover" && (!coords.original || !coords.nueva)) {
  alert("⚠️ En movimiento debes indicar coordenadas Original y Nueva.");
  return;
}

propuestasMasivasInline.push({
  tipo,
  titulo,
  coords,
  img,
  direccion,
  fecha: new Date().toISOString()
});

actualizarListaMasivaInline();
limpiarSoloCamposFormulario(); // No borra Estado, Nick, Tipo

    });
  }

  function actualizarListaMasivaInline() {
    if (!listaInline || !contadorInline) return;
    listaInline.innerHTML = "";
    propuestasMasivasInline.forEach((p, i) => {
      const li = document.createElement("li");
     // Mostrar coordenadas correctamente
let coordTexto = "";
if (p.tipo === "reubicacion" || p.tipo === "mover") {
  coordTexto = `${p.coords?.original || "(sin original)"} → ${p.coords?.nueva || "(sin nueva)"}`;
} else {
  coordTexto = p.coords || "(sin coordenadas)";
}


li.innerHTML = `<b>${i + 1}.</b> [${p.tipo}] ${p.titulo} — 
  <small>${coordTexto}</small>
  <button data-index="${i}" class="btn-eliminar-item" style="margin-left:8px;">❌</button>`;

      listaInline.appendChild(li);
    });
    contadorInline.textContent = propuestasMasivasInline.length;

    // Eliminar item
    listaInline.querySelectorAll(".btn-eliminar-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10);
        propuestasMasivasInline.splice(idx, 1);
        actualizarListaMasivaInline();
      });
    });
  }

  // Guardar TODAS las propuestas en fila (una por una)
  if (btnGuardarTodasInline) {
    btnGuardarTodasInline.addEventListener("click", async () => {
      if (propuestasMasivasInline.length === 0) {
        alert("⚠️ La lista está vacía.");
        return;
      }
      const nombre = document.getElementById("gestion-nombre").value.trim();
      if (!nombre) {
        alert('El campo "Tu Nick (Wayfarer/PoGo)" no puede estar vacío.');
        document.getElementById("gestion-nombre").focus();
        return;
      }

      btnGuardarTodasInline.disabled = true;
      const old = btnGuardarTodasInline.textContent;
      btnGuardarTodasInline.textContent = "Guardando lote... ⏳";

      let ok = 0, fail = 0;
      for (const p of propuestasMasivasInline) {
        // Simular el payload como en "obtenerDatosFormularioActual"
        const estado = document.getElementById("gestion-estado").value;
let datos = {
  action: "guardarWayfarer",
  tipo: p.tipo,
  estado,
  nombre,
  fecha: p.fecha || new Date().toISOString(),
  titulo: p.titulo,
  img: p.img || "",
  // ✅ Clasificación para guardar en Google Sheet (columna E)
  tipoClasificado:
    p.tipo === "mover"
      ? "Movimiento de Pokeparada"
      : p.tipo === "reubicacion"
      ? "Propuesta con Reubicación"
      : "Propuesta de Pokeparada"
};


if (p.tipo === "nueva") {
  datos.coorActual = p.coords || "";
  datos.coorModificada = "";
  datos.direccion = p.direccion || "";
} else if (p.tipo === "reubicacion") {
  datos.coorActual = p.coords?.original || "";
  datos.coorModificada = p.coords?.nueva || "";
  datos.direccion = p.direccion || "";
} else {
  // mover
  datos.coorActual = p.coords?.original || "";
  datos.coorModificada = p.coords?.nueva || "";
  datos.direccion = p.direccion || "";
}


        // Normalizar ID imagen si viene URL
        if (datos.img && datos.img.includes("googleusercontent.com/")) {
          const parts = datos.img.split("/");
          datos.img = parts[parts.length - 1].split("=")[0];
        }

        try {
          const fd = new FormData();
          fd.append("data", JSON.stringify(datos));
          const res = await fetch(DEPLOY_URL, { method: "POST", body: fd });
          const out = await res.json();
          if (!out.ok) throw new Error(out.mensaje || "Error");
          ok++;
        } catch (e) {
          console.error("Guardado masivo error item:", p, e);
          fail++;
        }
      }

      alert(`📦 Lote finalizado.\n✅ OK: ${ok}\n❌ Fallidos: ${fail}`);
      btnGuardarTodasInline.disabled = false;
      btnGuardarTodasInline.textContent = old;

  if (ok > 0) {
  limpiarSoloCamposFormulario(); // Limpia título, coordenadas, imagen
  limpiarListaMasiva(true);      // Vacía lista y desactiva modo masivo
  cargarTarjetas();
}

    });
  }
// === PARTE 4/4 ===

  // -----------------------------
  // Delegación de eventos globales
  // -----------------------------
  document.body.addEventListener(
    "blur",
    function (e) {
      if (e.target.classList.contains("geocode-trigger")) {
        fetchGeocode(e.target);
      }
    },
    true
  );

  document.body.addEventListener("change", function (e) {
    // Check reubicación → abrir modal y centrar en coordenada inicial
    if (e.target.id === "reubicacion-check") {
      const fila = document.getElementById("fila-reubicacion-form");
      const modal = document.getElementById("mapModal");
      const coordOriginal = document.getElementById("nueva-coordenadas-reu").value;
      if (e.target.checked) {
        setFlex(fila, true);
        modal.classList.add("visible");
        loadGoogleMapsApi(() => initMap(coordOriginal, ""));
      } else {
        setFlex(fila, false);
        const inputDestino = document.getElementById("nueva-coordenadas-reubicadas-reu");
        if (inputDestino) inputDestino.value = "";
        modal.classList.remove("visible");
        if (newMarker) newMarker.setMap(null);
      }
    }

    // Cambio de tipo => mostrar el formulario seleccionado (sin tocar bloque masivo)
    if (e.target.id === "tipo-propuesta-select") {
      const tipo = e.target.value;
      const formNueva = document.getElementById("form-nueva-propuesta");
      const formReu = document.getElementById("form-reubicacion");
      const formMover = document.getElementById("form-mover-propuesta");

      setVisible(formNueva, tipo === "nueva");
      setVisible(formReu, tipo === "reubicacion");
      setVisible(formMover, tipo === "mover");
    }
  });

  document.body.addEventListener("click", function (e) {
    // Modal botones
    if (e.target.id === "map-btn-cancelar") {
      document.getElementById("mapModal").classList.remove("visible");
    }
    if (e.target.id === "map-btn-guardar") {
      if (!newMarker) {
        alert("Selecciona una nueva ubicación en el mapa.");
        return;
      }
      const { lat, lng } = newMarker.getPosition().toJSON();
      const val = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      // Intentar llenar campo de reubicación (reubicación)
      const outReu = document.getElementById("nueva-coordenadas-reubicadas-reu");
      if (outReu) outReu.value = val;
      document.getElementById("mapModal").classList.remove("visible");
    }

    // Ver mapa (mini o grande) desde botón con clase .btn-ver-mapa
    if (e.target.classList.contains("btn-ver-mapa")) {
      const tipo = document.getElementById("tipo-propuesta-select").value;
      let orig = "", reub = "";
      if (tipo === "nueva") {
        // si en el futuro agregas campo reubicadas para "nueva", captúralo aquí
        orig = document.getElementById("nueva-coordenadas").value;
        reub = "";
      } else if (tipo === "reubicacion") {
        orig = document.getElementById("nueva-coordenadas-reu").value;
        reub = document.getElementById("nueva-coordenadas-reubicadas-reu").value;
      } else if (tipo === "mover") {
        orig = document.getElementById("mover-coor-actual").value;
        reub = document.getElementById("mover-coor-modificada").value;
      }
      document.getElementById("mapModal").classList.add("visible");
      loadGoogleMapsApi(() => initMap(orig, reub));
    }

    // Colapsar sección
    if (e.target.classList.contains("toggle-btn")) {
      const targetId = e.target.getAttribute("data-target");
      const content = document.querySelector(targetId);
      if (content) {
        const hidden = content.style.display === "none";
        content.style.display = hidden ? "block" : "none";
        e.target.textContent = hidden ? "-" : "+";
      }
    }

    // Mini-mapa en tarjetas (abre modal miniatura)
    if (e.target.classList.contains("mapa-miniatura")) {
      const orig = e.target.dataset.coorActual;
      const reub = e.target.dataset.coorModificada;
      const modalMini = document.getElementById("mapModalMiniatura");
      modalMini.classList.add("visible");
      loadGoogleMapsApi(() => initMapMiniatura(orig, reub));
    }
    if (e.target.id === "mapMiniatura-btn-cerrar") {
      document.getElementById("mapModalMiniatura").classList.remove("visible");
    }

    // Botón Editar (placeholder)
// Botón Editar → abre modal de edición
if (e.target.classList.contains("btn-editar-propuesta")) {
  const idFila = Number(e.target.dataset.id);
  const p = propuestasCache.get(idFila);
  if (!p) { alert("No se encontró la propuesta."); return; }

  editContext.idFila = idFila;

  // ✅ Aquí ya NO se llenan todos los campos.
  // ✅ Solo se abre el modal y se pide Nick.
  document.getElementById("editar-nick").value = "";
  document.getElementById("modal-editar").classList.add("visible");

  // ✅ Ocultar todos los campos hasta validar Nick
  document.querySelectorAll("#modal-editar .form-group, .modal-editar-botones")
    .forEach(el => el.style.display = "none");

  // ✅ Dejar visible solo el campo Nick y un botón de “Validar Nick”
  document.getElementById("editar-nick").style.display = "block";
  document.getElementById("btn-validar-nick").style.display = "block";
}


  });


// Mostrar/ocultar campos según el tipo elegido en el modal
function toggleCamposPorTipo(tipo) {
  // Para "nueva" → solo coorActual (opcional)
  // Para "reubicacion" y "mover" → coorActual + coorModificada (con mapa)
  const campoMod = document.getElementById("edit-coor-modificada").parentElement.parentElement; // el form-group
  if (tipo === "nueva") {
    campoMod.style.display = "none";
  } else {
    campoMod.style.display = "block";
  }
}

// Cambio de tipo en el modal
document.getElementById("edit-tipo")?.addEventListener("change", function() {
  toggleCamposPorTipo(this.value);
});

// Cerrar modal
document.getElementById("modal-editar-cerrar")?.addEventListener("click", () => {
  document.getElementById("modal-editar").classList.remove("visible");
});
document.getElementById("btn-cancelar-edicion")?.addEventListener("click", () => {
  document.getElementById("modal-editar").classList.remove("visible");
});

// Abrir mapa para elegir "coor modificada" dentro del modal
document.getElementById("edit-abrir-mapa")?.addEventListener("click", () => {
  const orig = document.getElementById("edit-coor-actual").value.trim();
  const reub = document.getElementById("edit-coor-modificada").value.trim();
  document.getElementById("mapModal").classList.add("visible");
  loadGoogleMapsApi(() => initMap(orig, reub));
});

// Cuando el usuario guarda en el mapa reutilizado → ya tienes el handler que coloca en reubicación.
// Le añadimos que también intente escribir en el campo de edición si existe:
const oldMapGuardar = document.getElementById("map-btn-guardar")?.onclick;
document.getElementById("map-btn-guardar").onclick = function () {
  if (!newMarker) {
    alert("Selecciona una nueva ubicación en el mapa.");
    return;
  }
  const { lat, lng } = newMarker.getPosition().toJSON();
  const val = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const outReu = document.getElementById("nueva-coordenadas-reubicadas-reu");
  if (outReu) outReu.value = val;
  const outEdit = document.getElementById("edit-coor-modificada");
  if (outEdit) outEdit.value = val;
  document.getElementById("mapModal").classList.remove("visible");
};

// Guardar edición
document.getElementById("btn-guardar-edicion")?.addEventListener("click", async () => {
  if (!editContext.idFila) { alert("No hay propuesta seleccionada."); return; }

  const nick = document.getElementById("editar-nick").value.trim();
  if (!nick) { alert("Ingresa tu Nick para confirmar."); return; }

  const tipo = document.getElementById("edit-tipo").value;
  const estado = document.getElementById("edit-estado").value;
  const titulo = document.getElementById("edit-titulo").value.trim();
  const img = document.getElementById("edit-img").value.trim();
  const direccion = document.getElementById("edit-direccion").value.trim();
  const coorActual = document.getElementById("edit-coor-actual").value.trim();
  const coorModificada = document.getElementById("edit-coor-modificada").value.trim();

  // Validación rápida: si tipo es reubicación o mover → coorModificada debería existir
  if ((tipo === "reubicacion" || tipo === "mover") && !coorModificada) {
    alert("Para 'Reubicación' o 'Movimiento' debes indicar la Coordenada Modificada.");
    return;
  }

  // Normalizar imagen si pega URL de googleusercontent
  let imgNorm = img;
  if (imgNorm && imgNorm.includes("googleusercontent.com/")) {
    const parts = imgNorm.split("/");
    imgNorm = parts[parts.length - 1].split("=")[0];
  }

  const payload = {
    action: "editarWayfarer",
    idFila: editContext.idFila,
    nick,
    // Enviamos solo campos que pueden cambiar:
    tipo,                // nueva / reubicacion / mover
    estado,              // En Cola / En Votacion / Aceptada / Rechazada
    titulo,
    img: imgNorm,
    direccion,
    coorActual,
    coorModificada
  };

  try {
    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));
    const res = await fetch(DEPLOY_URL, { method: "POST", body: fd });
    const out = await res.json();

    if (!out.ok) throw new Error(out.mensaje || "Error al actualizar");

    alert("✅ Cambios guardados correctamente.");
    document.getElementById("modal-editar").classList.remove("visible");
    cargarTarjetas(); // refrescar vista
  } catch (err) {
    alert("❌ No se pudo guardar: " + err.message);
    console.error(err);
  }
});



  // -----------------------------
  // Inicializar visibilidad de formularios según el select
  // -----------------------------
  (function initToggleForms() {
    const tipo = document.getElementById("tipo-propuesta-select")?.value || "nueva";
    const formNueva = document.getElementById("form-nueva-propuesta");
    const formReu = document.getElementById("form-reubicacion");
    const formMover = document.getElementById("form-mover-propuesta");
    setVisible(formNueva, tipo === "nueva");
    setVisible(formReu, tipo === "reubicacion");
    setVisible(formMover, tipo === "mover");
  })();


document.getElementById("btn-validar-nick")?.addEventListener("click", () => {
  const nickIngresado = document.getElementById("editar-nick").value.trim().toLowerCase();
  if (!nickIngresado) {
    alert("⚠️ Ingresa tu Nick para continuar");
    return;
  }

  const p = propuestasCache.get(editContext.idFila);
  const autorOriginal = (p.nombre || "").trim().toLowerCase();

  if (nickIngresado !== autorOriginal) {
    alert("⚠️ Este Nick no coincide con el creador de la propuesta.");
    return;
  }

  // ✅ Nick correcto → Mostrar campos de edición
  document.querySelectorAll("#modal-editar .form-group, .modal-editar-botones")
    .forEach(el => el.style.display = "block");

  document.getElementById("btn-validar-nick").style.display = "none";

  // ✅ Llenar los campos con los datos actuales
  document.getElementById("edit-titulo").value = p.titulo || "";
  document.getElementById("edit-img").value = p.img || "";
  document.getElementById("edit-direccion").value = p.direccion || "";
  document.getElementById("edit-coor-actual").value = p.coorActual || "";
  document.getElementById("edit-coor-modificada").value = p.coorModificada || "";

  // Tipo
  const mapaReverse = {
    "Propuesta de Pokeparada": "nueva",
    "Propuesta con Reubicación": "reubicacion",
    "Movimiento de Pokeparada": "mover"
  };
  document.getElementById("edit-tipo").value = mapaReverse[p.clasificado] || "nueva";

  // Estado
  document.getElementById("edit-estado").value = p.estado || "En Cola";

  toggleCamposPorTipo(document.getElementById("edit-tipo").value);
});


  // -----------------------------
  // Boot inicial
  // -----------------------------
  cargarTarjetas();
  loadGoogleMapsApi(() => {}); // precarga
  console.log("tab2_manage.js (Optimizado) listo ✅");
};
