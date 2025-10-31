// js/tab2_manage.js

window.initTab2 = function() {

  // --- Variables Globales ---
  let map; 
  let originalMarker; 
  let newMarker; 
  let googleMapsScriptLoaded = false; 
  const DEPLOY_URL = window.APP_CONFIG.SHEET_URL; 
  let geocoder; 

  // --- Función para Parsear Coordenadas ---
  function parseCoords(coordString) {
    if (!coordString) return null;
    const parts = coordString.split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  }

  // --- 🆕 ¡FUNCIÓN CORREGIDA! --- Cargar la API de Google Maps
  // (Este es el arreglo para 'google.maps.Geocoder is not a constructor')
  function loadGoogleMapsApi(callback) {
    if (googleMapsScriptLoaded) {
      if(callback) callback();
      return;
    }
    if (!window.APP_CONFIG || !window.APP_CONFIG.API_KEY) {
      console.error("Error: API_KEY no encontrada");
      alert("Error de configuración: Falta la API_KEY de Google.");
      return;
    }
    const apiKey = window.APP_CONFIG.API_KEY;
    
    // Volvemos al método fiable: cargar todo en una sola URL
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsScriptLoaded = true;
      geocoder = new google.maps.Geocoder(); // ¡Ahora SÍ se puede crear!
      console.log("Google Maps y Geocoder cargados.");
      if(callback) callback();
    };
    script.onerror = () => {
      console.error("Error al cargar el script de Google Maps.");
      alert("No se pudo cargar Google Maps.");
    };
    document.head.appendChild(script);
  }

// --- Función para Iniciar el Mapa (Modal) ---
function initMap(originalCoordsStr, reubicacionCoordsStr) {
  const mapCanvas = document.getElementById('map-canvas');
  if (!mapCanvas) return;

  // Asegurarse de que la API esté cargada
  if (!googleMapsScriptLoaded) {
    loadGoogleMapsApi(() => initMap(originalCoordsStr, reubicacionCoordsStr));
    return;
  }

  if (originalMarker) originalMarker.setMap(null);
  if (newMarker) newMarker.setMap(null);
  originalMarker = null; newMarker = null;

  let originalCoords = parseCoords(originalCoordsStr);
  let reubicacionCoords = parseCoords(reubicacionCoordsStr);
  let centerCoords = reubicacionCoords || originalCoords || { lat: -12.046374, lng: -77.042793 };

map = new google.maps.Map(mapCanvas, {
  center: centerCoords,
  zoom: 17,
   mapTypeId: 'hybrid', 
  disableDefaultUI: true,   // Desactiva todo por defecto
  gestureHandling: "greedy", // Evita el mensaje del Ctrl
  zoomControl: false,         // ✅ Mantiene los botones +/−
  fullscreenControl: true,   // ✅ Muestra el botón de pantalla completa
  mapTypeControl: false,      // Selector de tipo de mapa (satélite, terreno, etc.)
styles: [
    {
      featureType: "poi", // Oculta puntos de interés (tiendas, restaurantes, etc.)
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit", // Oculta transporte público
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "administrative.land_parcel", // Oculta límites internos
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "landscape.man_made", // Quita zonas construidas resaltadas
      stylers: [{ visibility: "off" }]
    }
  ]
});



  // --- 📍 Marcador original (Wayfarer naranja)
  if (originalCoords) {
    originalMarker = new google.maps.Marker({
      position: originalCoords,
      map: map,
      icon: "https://wayfarer.nianticlabs.com/imgpub/marker-orange-transparent-64.png",
      title: "Ubicación Original"
    });
  }

  // --- 📍 Marcador reubicado (Wayfarer verde)
  if (reubicacionCoords) {
    newMarker = new google.maps.Marker({
      position: reubicacionCoords,
      map: map,
      icon: "https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png",
      title: "Nueva Ubicación",
      draggable: true
    });
  }

  // --- 🎯 Click para crear o mover marcador verde
  map.addListener("click", (e) => {
    const clickedCoords = e.latLng;
    if (!newMarker) {
      newMarker = new google.maps.Marker({
        position: clickedCoords,
        map: map,
        icon: "https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png",
        title: "Nueva Ubicación",
        draggable: true
      });
    } else {
      newMarker.setPosition(clickedCoords);
    }
  });
}

// --- 🆕 FUNCIÓN NUEVA --- Modal exclusivo para miniatura
function initMapMiniatura(originalCoordsStr, reubicacionCoordsStr) {
  const mapCanvas = document.getElementById('map-canvas-miniatura');
  if (!mapCanvas) return;

  // Asegurar que la API esté lista
  if (!googleMapsScriptLoaded) {
    loadGoogleMapsApi(() => initMapMiniatura(originalCoordsStr, reubicacionCoordsStr));
    return;
  }

  // Limpiar marcadores previos
  if (originalMarker) originalMarker.setMap(null);
  if (newMarker) newMarker.setMap(null);
  originalMarker = null;
  newMarker = null;

  // Parsear coordenadas
  let originalCoords = parseCoords(originalCoordsStr);
  let reubicacionCoords = parseCoords(reubicacionCoordsStr);
  let centerCoords = reubicacionCoords || originalCoords || { lat: -12.046374, lng: -77.042793 };

  // Crear mapa con más zoom
map = new google.maps.Map(mapCanvas, {
  center: centerCoords,
  zoom: 40,
  mapTypeId: 'satellite',
  disableDefaultUI: true, // quita controles de zoom, tipo de mapa, etc.
  gestureHandling: "greedy", // evita el aviso de "mantén pulsado Ctrl"
  styles: [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ visibility: "off" }]
    }
  ]
});


  // Marcadores
  if (originalCoords) {
    new google.maps.Marker({
      position: originalCoords,
      map: map,
      icon: "https://wayfarer.nianticlabs.com/imgpub/marker-orange-transparent-64.png",
      title: "Ubicación"
    });
  }
  if (reubicacionCoords) {
    new google.maps.Marker({
      position: reubicacionCoords,
      map: map,
      icon: "https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png",
      title: "Ubicación Alterna"
    });
  }
}


  // --- Funciones del Formulario (Validar, Limpiar, Obtener) ---
  
  // --- 🆕 ¡FUNCIÓN MODIFICADA! --- Validación de "Mover:"
  function validarFormulario() {
    const tipo = document.querySelector('input[name="tipoPropuesta"]:checked').value;
    let camposRequeridos = ['gestion-nombre']; 
    if (tipo === 'nueva') {
      camposRequeridos.push('nueva-titulo');
    } else { // 'mover'
      camposRequeridos.push('mover-titulo', 'mover-coor-actual', 'mover-coor-modificada');
      
      // --- ¡ARREGLO! --- Forzar el prefijo "Mover:"
      const moverTitulo = document.getElementById('mover-titulo');
      if (moverTitulo.value && !moverTitulo.value.trim().toLowerCase().startsWith("mover:")) {
        alert('Error: El título de "Mover Propuesta" DEBE empezar con la palabra "Mover:" (ej: "Mover: Estatua Central")');
        moverTitulo.focus();
        return false;
      }
    }
    
    for (const id of camposRequeridos) {
      const campo = document.getElementById(id);
      if (!campo || !campo.value || campo.value.trim() === '') {
        let label = campo.previousElementSibling;
        if (label && label.tagName !== 'LABEL') {
           label = campo.closest('.form-group').querySelector('label');
        }
        const labelText = label ? label.textContent : `El campo ${id}`;
        campo.focus();
        alert(`Error: "${labelText}" no puede estar vacío.`);
        return false; 
      }
    }
    return true; 
  }
  
  function limpiarFormulario() {
    document.getElementById('nueva-titulo').value = '';
    document.getElementById('nueva-coordenadas').value = '';
    document.getElementById('nueva-img').value = '';
    document.getElementById('nueva-reubicar-check').checked = false;
    document.getElementById('nueva-coordenadas-reubicadas').value = '';
    document.getElementById('fila-reubicacion').style.display = 'none';
    document.getElementById('nueva-direccion').value = '';
    document.getElementById('mover-titulo').value = '';
    document.getElementById('mover-img').value = '';
    document.getElementById('mover-coor-actual').value = '';
    document.getElementById('mover-coor-modificada').value = '';
    document.getElementById('mover-direccion').value = '';
    document.getElementById('gestion-estado').value = 'En Cola';
    document.getElementById('gestion-nombre').value = '';
    document.getElementById('tipoPropuestaNueva').checked = true;
    document.getElementById('form-nueva-propuesta').style.display = 'block';
    document.getElementById('form-mover-propuesta').style.display = 'none';
  }

  // --- 🆕 ¡FUNCIÓN MODIFICADA! --- Arreglo del .split() y URL
  function obtenerDatosDelFormulario() {
    const tipo = document.querySelector('input[name="tipoPropuesta"]:checked').value;
    let datos = {
      action: "guardarWayfarer", 
      tipo: tipo, // Guardamos el 'tipo' para la lógica de tags
      estado: document.getElementById('gestion-estado').value,
      nombre: document.getElementById('gestion-nombre').value.trim(),
      fecha: new Date().toISOString() 
    };

    if (tipo === 'nueva') {
      datos.titulo = document.getElementById('nueva-titulo').value.trim();
      datos.coorActual = document.getElementById('nueva-coordenadas').value.trim();
      datos.coorModificada = document.getElementById('nueva-coordenadas-reubicadas').value.trim();
      datos.direccion = document.getElementById('nueva-direccion').value;
      let imgInput = document.getElementById('nueva-img').value.trim();
      
      // --- ¡ARREGLO! --- Extracción de ID de Imagen (con chequeo de campo vacío)
      if (imgInput && imgInput.includes('googleusercontent.com/')) {
        const parts = imgInput.split('/');
        datos.img = parts[parts.length - 1].split('=')[0]; // Toma el ID
      } else {
        datos.img = imgInput; // Guarda lo que sea que haya escrito
      }

    } else { // 'mover'
      datos.titulo = document.getElementById('mover-titulo').value.trim();
      datos.coorActual = document.getElementById('mover-coor-actual').value.trim();
      datos.coorModificada = document.getElementById('mover-coor-modificada').value.trim();
      datos.direccion = document.getElementById('mover-direccion').value;
      let imgInput = document.getElementById('mover-img').value.trim();
      
      // --- ¡ARREGLO! --- Extracción de ID de Imagen (con chequeo de campo vacío)
      if (imgInput && imgInput.includes('googleusercontent.com/')) {
        const parts = imgInput.split('/');
        datos.img = parts[parts.length - 1].split('=')[0];
      } else {
        datos.img = imgInput;
      }
    }
    return datos;
  }

  // --- Función: Guardar Propuesta (Real) ---
  async function fetchGuardarPropuesta(btn) {
    if (!validarFormulario()) return;
    btn.disabled = true;
    btn.textContent = 'Guardando... ⏳';
    
    let datos;
    try {
      // El error de split se previene aquí
      datos = obtenerDatosDelFormulario();
    } catch (err) {
      console.error("Error al obtener datos del formulario:", err);
      alert("Error al procesar la URL de la imagen. " + err.message);
      btn.disabled = false;
      btn.textContent = 'Subir Propuesta';
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(datos));
      const res = await fetch(DEPLOY_URL, { method: "POST", body: formData });
      const result = await res.json();
      if (result.ok) {
        alert(result.mensaje || "✅ ¡Propuesta guardada con éxito!");
        limpiarFormulario();
        cargarTarjetas(); 
      } else {
        throw new Error(result.mensaje || "Error desconocido del servidor");
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("❌ Error al guardar: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Subir Propuesta';
    }
  }

// --- 🧭 FUNCIÓN MEJORADA (v4) --- Corrige "Distrito de Lima" → distrito real según coordenadas
async function fetchGeocode(coordInput) {
  if (!geocoder) {
    console.warn("Geocoder no inicializado. Cargando API...");
    loadGoogleMapsApi(() => fetchGeocode(coordInput));
    return;
  }

  const coords = parseCoords(coordInput.value);
  if (!coords) return;

  const inputId = coordInput.id;
  let targetHiddenInputId = "";
  if (inputId === "nueva-coordenadas") targetHiddenInputId = "nueva-direccion";
  else if (inputId === "mover-coor-actual") targetHiddenInputId = "mover-direccion";
  else return;

  const hiddenInput = document.getElementById(targetHiddenInputId);
  if (!hiddenInput) return;

  try {
    const response = await geocoder.geocode({ location: coords });
    if (!response.results || !response.results[0]) {
      hiddenInput.value = "Dirección no encontrada";
      return;
    }

    const comp = response.results[0].address_components;
    console.log("🧩 Datos crudos del Geocoder:", comp);

    const numero = comp.find(c => c.types.includes("street_number"))?.long_name || "";
    const calle = comp.find(c => c.types.includes("route"))?.long_name || "";
    const sublocalidad = comp.find(c => c.types.includes("sublocality_level_1"))?.long_name || "";
    let distrito =
      comp.find(c => c.types.includes("locality"))?.long_name ||
      comp.find(c => c.types.includes("administrative_area_level_3"))?.long_name ||
      "";
    let provincia = comp.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "";
    const pais = comp.find(c => c.types.includes("country"))?.long_name || "";

    // Limpieza básica
    if (distrito) distrito = distrito.replace(/^Distrito de\s*/i, "").trim();
    if (provincia) provincia = provincia.replace(/^Provincia de\s*/i, "").trim();

    // --- 🔍 Corrección por coordenadas conocidas ---
    // Si Google devuelve "Distrito de Lima" pero el punto está al norte (lat < -11.85),
    // asumimos Comas o Los Olivos según la longitud
    if (distrito === "Lima" || distrito === "Distrito de Lima") {
      if (coords.lat < -11.9 && coords.lat > -12.05) {
        // Norte de Lima
        if (coords.lng < -77.05) distrito = "Comas";
        else if (coords.lng < -77.03) distrito = "Los Olivos";
        else distrito = "San Martín de Porres";
      } else if (coords.lat < -12.0) {
        distrito = "Lima";
      }
    }

    // --- Evitar duplicados ---
    if (provincia && distrito && provincia.toLowerCase() === distrito.toLowerCase()) provincia = "";

    // --- Ensamblar ---
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

    hiddenInput.value = direccionCustom;
    console.log("📍 Dirección personalizada:", direccionCustom);
  } catch (err) {
    console.error("Error de Geocoding:", err);
    hiddenInput.value = "Error de Geocoding";
  }
}

  // --- ¡FUNCIÓN MODIFICADA! --- Cargar Tarjetas
  async function cargarTarjetas() {
    const cont = document.getElementById("gestion-lista-tarjetas");
    if (!cont) return;
    cont.innerHTML = `<p style="text-align:center; color:#ecf0f1; font-size:1.2rem;">Cargando propuestas... 🤖</p>`;

    try {
      const res = await fetch(`${DEPLOY_URL}?action=getWayfarerPropuestas`);
      const data = await res.json();
      if (!data.ok || !data.propuestas) {
        throw new Error(data.mensaje || "No se pudieron cargar los datos.");
      }
      if (data.propuestas.length === 0) {
        cont.innerHTML = `<p style="text-align:center; color:#ecf0f1; font-size:1.2rem;">No hay propuestas activas.</p>`;
        return;
      }

      let html = "";
      data.propuestas.forEach(p => {
        // --- ¡ARREGLO! --- Lógica de Tags (basada en el Título)
        let tipoTag = "";
        let esReubicacion = p.coorActual && p.coorModificada;
        // Comprueba si el título EMPIEZA con "mover:", ignorando mayúsculas/minúsculas
        let esMovimiento = (p.titulo || "").trim().toLowerCase().startsWith("mover:"); 

        if (esMovimiento) {
          tipoTag = `<span class="prop-tag tag-mover tag-tipo-propuesta">Movimiento de Pokeparada</span>`;
        } else if (esReubicacion) {
          tipoTag = `<span class="prop-tag tag-reubicada tag-tipo-propuesta">Propuesta con Reubicacion</span>`;
        } else {
          tipoTag = `<span class="prop-tag tag-nueva tag-tipo-propuesta">Propuesta de Pokeparada</span>`;
        }
        let estadoTag = (p.estado === "En Votacion") ? `<span class="prop-tag estado-votacion">En Votación</span>` : `<span class="prop-tag estado-cola">En Cola</span>`;
        
        let ubicacionHtml = `<p><b>Dirección:</b> <span>${p.direccion || '(No disponible)'}</span></p>`;
        if (esReubicacion) { 
          ubicacionHtml += `
            <p><b>Original (Rojo):</b> <span>${p.coorActual}</span></p>
            <p><b>Modificada (Verde):</b> <span>${p.coorModificada}</span></p>
          `;
        } else { 
          ubicacionHtml += `<p><b>Coordenadas:</b> <span>${p.coorActual}</span></p>`;
        }
        
  // --- 🌍 MINI MAPA MEJORADO --- con zoom cercano e íconos Wayfarer
let mapaUrl = `https://maps.googleapis.com/maps/api/staticmap?size=360x300&scale=2&zoom=18&maptype=satellite&key=${window.APP_CONFIG.API_KEY}`;

if (esReubicacion && p.coorActual && p.coorModificada) {
  mapaUrl += 
    `&markers=icon:https://wayfarer.nianticlabs.com/imgpub/marker-orange-transparent-64.png%7C${p.coorActual}` +
    `&markers=icon:https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png%7C${p.coorModificada}`;
} else if (p.coorActual) {
  mapaUrl += `&markers=icon:https://wayfarer.nianticlabs.com/imgpub/marker-green-64.png%7C${p.coorActual}`;
} else {
  mapaUrl = "assets/map_placeholder.jpg"; // Fallback
}


        // --- ¡ARREGLO! --- URL de Imagen Principal (Usando tu formato)
const imgUrl = (p.img && p.img.startsWith('http'))
  ? p.img
  : (p.img
      ? `https://lh3.googleusercontent.com/${p.img}=s400`
      : "assets/map_placeholder.jpg");


        // Ensamblar tarjeta
        html += `
          <article class="gestion-card" data-id-fila="${p.id}">
            <div class="imagen-area">
              <img src="${imgUrl}" alt="Imagen propuesta" class="imagen-principal">
              <button class="btn-editar-propuesta" data-id="${p.id}">
                Editar
              </button>
              ${tipoTag}
            </div>
            <div class="contenido">
              <span class="prop-titulo">${p.titulo}</span>
              <div class="tag-container">
                ${estadoTag}
              </div>
              <div class="ubicacion">
                ${ubicacionHtml}
              </div>
            </div>
            <div class="mapa">
              <img src="${mapaUrl}" alt="Mini-mapa" class="mapa-miniatura" 
                   data-coor-actual="${p.coorActual || ''}"
                   data-coor-modificada="${p.coorModificada || ''}"
                   style="width:100%; height:100%; object-fit:cover; border-radius: 0 12px 12px 0; cursor:pointer;">
            </div>
          </article>
        `;
      });
      cont.innerHTML = html;
    } catch (err) {
      console.error("Error al cargar tarjetas:", err);
      cont.innerHTML = `<p style="text-align:center; color:red; font-size:1.2rem;">❌ Error al cargar propuestas: ${err.message}</p>`;
    }
  }


  // ==================================================
  // --- DELEGACIÓN DE EVENTOS (Listeners Principales) ---
  // ==================================================
  
  // 'blur' para Geocodificación
  document.body.addEventListener('blur', function(e) {
    if (e.target.classList.contains('geocode-trigger')) {
      fetchGeocode(e.target);
    }
  }, true); 

  // 'change' para Formularios
  document.body.addEventListener('change', function(e) {
    // 1. LÓGICA FORMULARIO INTELIGENTE
    if (e.target.name === 'tipoPropuesta') {
      const tipo = e.target.value;
      const formNueva = document.getElementById('form-nueva-propuesta');
      const formMover = document.getElementById('form-mover-propuesta');
      if (formNueva && formMover) {
        formNueva.style.display = (tipo === 'nueva') ? 'block' : 'none';
        formMover.style.display = (tipo === 'mover') ? 'block' : 'none';
      }
    }

    // 2. LÓGICA CHECKBOX "REUBICAR"
    if (e.target.id === 'nueva-reubicar-check') {
      const mapModal = document.getElementById('mapModal');
      const filaReubicacion = document.getElementById('fila-reubicacion');
      const reubicacionInput = document.getElementById('nueva-coordenadas-reubicadas');
      
      if (e.target.checked) {
        filaReubicacion.style.display = 'flex';
        const coords = document.getElementById('nueva-coordenadas').value;
        if (!coords) {
          alert('Advertencia: No has ingresado coordenadas. El mapa se abrirá en la ubicación por defecto.');
        }
        mapModal.classList.add('visible');
        // --- ¡ARREGLO! --- Usar el nombre de función correcto
        loadGoogleMapsApi(() => initMap(coords, '')); 
      } else {
        mapModal.classList.remove('visible');
        filaReubicacion.style.display = 'none';
        reubicacionInput.value = "";
        if (newMarker) newMarker.setMap(null);
        newMarker = null;
      }
    }
  });

  // 'click' para Botones
  document.body.addEventListener('click', function(e) {
    
    // 3. LÓGICA BOTONES DEL MODAL
    if (e.target.id === 'map-btn-cancelar') {
      document.getElementById('mapModal').classList.remove('visible');
    }
    if (e.target.id === 'map-btn-guardar') {
      if (!newMarker) { alert("No has seleccionado una nueva ubicación."); return; }
      const coords = newMarker.getPosition().toJSON();
      const coordString = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      document.getElementById('nueva-coordenadas-reubicadas').value = coordString;
      document.getElementById('mapModal').classList.remove('visible');
    }

    // 4. LÓGICA BOTÓN "VER MAPA"
    if (e.target.id === 'btn-ver-mapa-reubicacion') {
      const orig = document.getElementById('nueva-coordenadas').value;
      const reub = document.getElementById('nueva-coordenadas-reubicadas').value;
      document.getElementById('mapModal').classList.add('visible');
      // --- ¡ARREGLO! --- Usar el nombre de función correcto
      loadGoogleMapsApi(() => initMap(orig, reub)); 
    }

    // 5. LÓGICA BOTÓN COLAPSAR (Sección)
    if (e.target.classList.contains('toggle-btn')) {
      const targetId = e.target.getAttribute('data-target');
      const content = document.querySelector(targetId);
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
          e.target.textContent = '-';
        } else {
          content.style.display = 'none';
          e.target.textContent = '+';
        }
      }
    }

    // 6. BOTÓN "SUBIR PROPUESTA"
    if (e.target.id === 'btn-guardar-propuesta') {
      fetchGuardarPropuesta(e.target);
    }
    
    // 7. Clic en Botón Editar
    if (e.target.classList.contains('btn-editar-propuesta')) {
      const idFila = e.target.dataset.id;
      alert("¡WIP! Has hecho clic en EDITAR la fila con ID: " + idFila);
    }
    
   // 8. Clic en Mini-Mapa (usa modal exclusivo)
if (e.target.classList.contains('mapa-miniatura')) {
  const orig = e.target.dataset.coorActual;
  const reub = e.target.dataset.coorModificada;
  const modalMini = document.getElementById('mapModalMiniatura');
  modalMini.classList.add('visible');
  loadGoogleMapsApi(() => initMapMiniatura(orig, reub));
}

// 9. Cerrar modal miniatura
if (e.target.id === 'mapMiniatura-btn-cerrar') {
  document.getElementById('mapModalMiniatura').classList.remove('visible');
}


  });

  console.log('tab2_manage.js v14 (Arreglos finales) inicializado.');
  
  // --- Carga inicial de tarjetas y API ---
  cargarTarjetas();
  // --- ¡ARREGLO! --- Usar el nombre de función correcto
  loadGoogleMapsApi(() => {}); // Carga la API al inicio en segundo plano
};