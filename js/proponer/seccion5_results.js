// === Construir la vista final combinada ===
// Se asume que ya existen:
// - files (Sección 1 - imágenes)
// - locations (Sección 3 - ubicaciones)
// - proposals (Sección 4 - textos)

function buildResults(){
  const container = document.getElementById("resultsList");
  container.innerHTML = "";

  Object.values(proposals).forEach((prop, idx)=>{
    const loc = window.locations.find(l => l.order === prop.num);
    const file = files[idx];

    // === Tarjeta principal ===
    const card = document.createElement("div");
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.border = "1px solid #ddd";
    card.style.borderRadius = "12px";
    card.style.background = "#fff";
    card.style.marginBottom = "12px";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";

    // === Header con botón ===
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.padding = "8px 12px";
    header.style.borderBottom = "1px solid #eee";
    header.style.background = "#f8f8f8";

    const headerTitle = document.createElement("strong");
    headerTitle.textContent = `Propuesta ${prop.num}`;
    headerTitle.style.fontSize = "15px";
    headerTitle.style.color = "#333";

    const btnToggle = document.createElement("button");
    btnToggle.textContent = "–";
    btnToggle.style.border = "none";
    btnToggle.style.background = "#eaeaea";
    btnToggle.style.borderRadius = "50%";
    btnToggle.style.width = "28px";
    btnToggle.style.height = "28px";
    btnToggle.style.display = "flex";
    btnToggle.style.alignItems = "center";
    btnToggle.style.justifyContent = "center";
    btnToggle.style.fontSize = "16px";
    btnToggle.style.cursor = "pointer";

    header.appendChild(headerTitle);
    header.appendChild(btnToggle);
    card.appendChild(header);

    // === Contenido principal (inicia visible) ===
    const contentWrapper = document.createElement("div");
    contentWrapper.style.display = "grid";
    contentWrapper.style.gridTemplateColumns = "1fr 2fr 1fr";
    contentWrapper.style.gap = "12px";
    contentWrapper.style.padding = "12px";

    // === Vista minimizada (oculta al inicio) ===
    const minimized = document.createElement("div");
    minimized.style.display = "none";
    minimized.style.textAlign = "center";
    minimized.style.fontWeight = "500";
    minimized.style.color = "#222";
    minimized.style.padding = "16px";
    minimized.style.fontSize = "15px";
    minimized.style.background = "#f9f9f9";
    minimized.style.borderRadius = "0 0 12px 12px";
    minimized.style.wordBreak = "break-word";
    minimized.style.whiteSpace = "normal";
    minimized.style.display = "none"; // forzado a oculto
    minimized.style.alignItems = "center";
    minimized.style.justifyContent = "center";

    const minText = document.createElement("span");
    minText.style.maxWidth = "90%";
    minText.style.lineHeight = "1.4";
    minText.innerHTML = `<strong>${prop.title}</strong><br><span style="color:#555">Copiado ✔</span>`;
    minimized.appendChild(minText);

    // === Botón toggle ===
    btnToggle.onclick = () => {
      if (contentWrapper.style.display === "none") {
        contentWrapper.style.display = "grid";
        minimized.style.display = "none";
        btnToggle.textContent = "–";
      } else {
        contentWrapper.style.display = "none";
        minimized.style.display = "flex";
        btnToggle.textContent = "+";
      }
    };

    // === Columna 1: Imagen ===
    const imgDiv = document.createElement("div");
    imgDiv.style.textAlign = "center";
    const img = document.createElement("img");
    img.style.width = "100%";
    img.style.height = "200px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    img.src = file
      ? (file.thumbnailLink
          ? file.thumbnailLink.replace(/=s\d+$/, "=s400")
          : `https://drive.google.com/uc?export=view&id=${file.id}`)
      : "https://via.placeholder.com/200x200?text=Sin+Imagen";
    imgDiv.appendChild(img);

    // === Columna 2: Texto + botones copiar ===
    const textDiv = document.createElement("div");
    textDiv.style.display = "flex";
    textDiv.style.flexDirection = "column";
    textDiv.style.gap = "8px";

    function addField(label, value){
      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.alignItems = "center";
      wrap.style.gap = "6px";

      const strong = document.createElement("strong");
      strong.textContent = `${label}:`;
      wrap.appendChild(strong);

      const span = document.createElement("span");
      span.textContent = value || "";
      span.style.flex = "1";
      span.style.wordBreak = "break-word";
      wrap.appendChild(span);

      // botón copiar
      const btnCopy = document.createElement("button");
      btnCopy.textContent = "📋";
      btnCopy.style.border = "none";
      btnCopy.style.background = "transparent";
      btnCopy.style.cursor = "pointer";
      btnCopy.style.fontSize = "14px";
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(value || "");
        btnCopy.textContent = "✅";
        setTimeout(()=>btnCopy.textContent="📋", 1200);
      };

      wrap.appendChild(btnCopy);
      textDiv.appendChild(wrap);
    }

    addField("Título", prop.title);
    addField("Descripción", prop.revisores);
    addField("Wayfarer", prop.entrenadores);
    addField("Categoría", prop.categoria);

    const state = document.createElement("div");
    state.textContent = "Estado: Pendiente";
    state.style.marginTop = "8px";
    state.style.textAlign = "center";
    state.style.fontWeight = "bold";
    state.style.color = "#0b84ff";
    textDiv.appendChild(state);

    // === Columna 3: Mapa ===
    const mapDiv = document.createElement("div");
    mapDiv.style.width = "100%";
    mapDiv.style.height = "200px";
    mapDiv.style.border = "1px solid #ccc";
    mapDiv.style.borderRadius = "8px";
    mapDiv.style.cursor = "pointer";

    if(loc){
      const miniMap = L.map(mapDiv, {
        attributionControl: false,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false
      }).setView([loc.lat, loc.lng], 16);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(miniMap);

      L.marker([loc.lat, loc.lng]).addTo(miniMap);
      setTimeout(()=>miniMap.invalidateSize(), 200);

      mapDiv.onclick=()=>openMap(loc.lat, loc.lng);
    } else {
      mapDiv.innerHTML = "<em style='color:#999'>Sin ubicación</em>";
      mapDiv.style.display = "flex";
      mapDiv.style.alignItems = "center";
      mapDiv.style.justifyContent = "center";
    }

    // === Ensamblado ===
    contentWrapper.appendChild(imgDiv);
    contentWrapper.appendChild(textDiv);
    contentWrapper.appendChild(mapDiv);

    card.appendChild(contentWrapper);
    card.appendChild(minimized);
    container.appendChild(card);
  });
}


 


