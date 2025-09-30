document.getElementById("btnConnect").onclick = listDriveFiles;
  /* ===== CONFIG ===== */
  const API_KEY = "AIzaSyAzq7mmTZTExpbetLRCkbopY5pDPBvOki4";
  const FOLDER_ID = "1SykigPCl4e003n6i2_PbopBrq22droo4";
  const SHEET_URL = "https://script.google.com/macros/s/AKfycby0mJlQC7FMR18yS_kPLRuUDw3CbaWEFXuzQqGzuT6jkVdF-53TPvCeUW8UaBxRQWpT/exec";

  let files = [];
  let selected = new Set();

  // ... 🚀 aquí pegas TODO tu código tal como lo tienes ...
/* === 1. Listar archivos de Drive === */
async function listDriveFiles(){
  const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType,thumbnailLink,webContentLink)`;
  const res = await fetch(url);
  const data = await res.json();
  files = data.files || [];
  renderFiles();
}

/* === Renderizar lista === */
function renderFiles(){
  const cont = document.getElementById("filesList");
  cont.innerHTML = "";
  files.forEach((f,i)=>{
    const isSel = selected.has(f.id);
    // aseguramos thumbnail
const thumb = `https://drive.google.com/uc?export=view&id=${f.id}`;

    const div = document.createElement("div");
    div.className = "file-card"+(isSel?" selected":"");
    div.innerHTML = `
      <div class="file-check">${isSel?"✓":""}</div>
      <img src="${thumb}" alt="${f.name}">
      <div class="file-num">#${i+1}</div>
    `;
    div.onclick = ()=>{
      if(selected.has(f.id)) selected.delete(f.id);
      else selected.add(f.id);
      renderFiles();
    };
    cont.appendChild(div);
  });
}

/* === Botones === */
document.getElementById("btnConnect").onclick = listDriveFiles;
document.getElementById("btnRefresh").onclick = listDriveFiles;
document.getElementById("btnSelectAll").onclick = ()=>{
  files.forEach(f=>selected.add(f.id));
  renderFiles();
};
document.getElementById("btnClearAll").onclick = ()=>{
  selected.clear();
  renderFiles();
};
 
 
/* === Collage === */
function generateCollage(){
  const canvas = document.getElementById("collageCanvas");
  const ctx = canvas.getContext("2d");

  const selFiles = files.filter(f => selected.has(f.id));
  if(selFiles.length === 0){ alert("Selecciona fotos primero"); return; }

  const cols = 3; // columnas
  const w = 300; // ancho por foto
  const h = 220; // alto por foto
  const rows = Math.ceil(selFiles.length/cols);

  canvas.width = cols*w;
  canvas.height = rows*h;

  ctx.fillStyle="#fff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font="20px Arial";
  ctx.fillStyle="#000";
  ctx.textAlign="left";

  selFiles.forEach((f,idx)=>{
    const img = new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>{
      const row = Math.floor(idx/cols);
      const col = idx%cols;
      const x = col*w;
      const y = row*h;
      ctx.drawImage(img,x,y,w,h);
      ctx.fillStyle="rgba(0,0,0,0.6)";
      ctx.fillRect(x,y,40,28);
      ctx.fillStyle="#fff";
      ctx.fillText(`#${idx+1}`,x+8,y+20);
    };
img.src = `https://drive.google.com/uc?export=view&id=${f.id}`;
  });

  // mostrar preview
  setTimeout(()=>{
    const dataUrl = canvas.toDataURL("image/png");
    const preview = document.getElementById("collagePreview");
    preview.src = dataUrl;
    preview.style.display="block";
  },800);
}

function downloadCollage(){
  const canvas = document.getElementById("collageCanvas");
  const link = document.createElement("a");
  link.download="collage.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// Ampliar al hacer clic
document.getElementById("collagePreview").onclick = ()=>{
  const modal = document.getElementById("modalCollage");
  const modalImg = document.getElementById("modalImg");
  modal.style.display="flex";
  modalImg.src = document.getElementById("collagePreview").src;
};

// Cerrar modal
document.getElementById("modalCollage").onclick = ()=>{
  document.getElementById("modalCollage").style.display="none";
};

document.getElementById("btnGenerateCollage").onclick = generateCollage;
document.getElementById("btnDownloadCollage").onclick = downloadCollage;

let locations = [];
let counter = 1;
let currentMap = null;

/* === Guardar ubicación con número automático === */
function saveLocation(){
  if(!navigator.geolocation){
    alert("Geolocalización no soportada.");
    return;
  }
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);

    const location = {
      id: Date.now(),
      order: counter,
      lat, lng
    };
    locations.push(location);
    counter++;
    renderLocations();
  }, err=>{
    alert("Error obteniendo ubicación: " + err.message);
  });
}

/* === Renderizar la lista de ubicaciones === */
function renderLocations(){
  const list = document.getElementById("locationsList");
  list.innerHTML = "";

  locations.sort((a,b)=>a.order-b.order).forEach(loc=>{
    const div = document.createElement("div");
    div.style.display="flex";
    div.style.alignItems="center";
    div.style.justifyContent="space-between";
    div.style.gap="12px";
    div.style.border="1px solid #ccc";
    div.style.padding="8px";
    div.style.borderRadius="6px";
    div.style.background="#f9f9f9";

    // Mini-mapa satelital Leaflet (Esri World Imagery)
    const thumbDiv = document.createElement("div");
    thumbDiv.style.width = "150px";
    thumbDiv.style.height = "100px";
    thumbDiv.style.border = "1px solid #999";
    thumbDiv.style.borderRadius = "4px";
    thumbDiv.style.cursor = "pointer";
    div.appendChild(thumbDiv);

    const thumbMap = L.map(thumbDiv, {
  attributionControl: false,
  zoomControl: false,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  tap: false
});

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19 }
).addTo(thumbMap);

// Ícono más pequeño
const miniIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32]
});

// Marcador y ajustar vista
const marker = L.marker([loc.lat, loc.lng], { icon: miniIcon }).addTo(thumbMap);
thumbMap.setView([loc.lat, loc.lng], 16);

// 🔑 Importante: refrescar para que el ícono no se “pierda”
setTimeout(() => {
  thumbMap.invalidateSize();
}, 200);


    thumbDiv.onclick = () => openMap(loc.lat, loc.lng);

    // Detalles
    const details = document.createElement("div");
    details.innerHTML = `<strong>Propuesta ${loc.order}</strong><br>
                         📍 ${loc.lat}, ${loc.lng}`;
    div.appendChild(details);

    // Botones
    const controls = document.createElement("div");
    controls.style.display="flex";
    controls.style.flexDirection="row";
    controls.style.gap="6px";

    const btnUp = document.createElement("button");
    btnUp.textContent="⬆️";
    btnUp.onclick=()=>moveLocation(loc.id,-1);

    const btnDown = document.createElement("button");
    btnDown.textContent="⬇️";
    btnDown.onclick=()=>moveLocation(loc.id,1);

    const btnEdit = document.createElement("button");
    btnEdit.textContent="✏️ Editar #";
    btnEdit.onclick=()=>{
      const newOrder = parseInt(prompt("Nuevo número de propuesta:", loc.order));
      if(!isNaN(newOrder)){
        loc.order=newOrder;
        renderLocations();
      }
    };

    const btnDelete = document.createElement("button");
    btnDelete.textContent="🗑️ Eliminar";
    btnDelete.onclick=()=>{
      locations=locations.filter(l=>l.id!==loc.id);
      renderLocations();
    };

    controls.appendChild(btnUp);
    controls.appendChild(btnDown);
    controls.appendChild(btnEdit);
    controls.appendChild(btnDelete);

    div.appendChild(controls);

    list.appendChild(div);
  });
}


/* === Mover arriba/abajo === */
function moveLocation(id,dir){
  const index = locations.findIndex(l=>l.id===id);
  if(index<0) return;
  const targetIndex = index+dir;
  if(targetIndex<0 || targetIndex>=locations.length) return;
  const tempOrder = locations[index].order;
  locations[index].order = locations[targetIndex].order;
  locations[targetIndex].order = tempOrder;
  renderLocations();
}

/* === Abrir mapa interactivo === */
function openMap(lat,lng){
  const modal = document.getElementById("modalMap");
  modal.style.display="flex";

  setTimeout(()=>{
    if(currentMap){ currentMap.remove(); }
    currentMap = L.map("leafletMap").setView([lat,lng],16);
  L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19, attribution: "Tiles © Esri" }
).addTo(currentMap);
    L.marker([lat,lng]).addTo(currentMap);
  },200);
}

/* === Cerrar mapa === */
function closeMap(){
  document.getElementById("modalMap").style.display="none";
  if(currentMap){
    currentMap.remove();
    currentMap = null;
  }
}

/* Cerrar modal si clic afuera */
document.getElementById("modalMap").onclick=(e)=>{
  if(e.target.id==="modalMap"){
    closeMap();
  }
};

/* Botón guardar */
document.getElementById("btnSaveLocation").onclick = saveLocation;

let proposals = {}; // { num -> {title, revisores, entrenadores, categoria} }

/* === Parsear propuestas pegadas === */
document.getElementById('btnParse').addEventListener('click', ()=>{
  const raw = document.getElementById('proposalsInput').value.trim();
  if(!raw){ 
    alert("Pega el texto de propuestas primero"); 
    return; 
  }

  const blocks = raw.split(/\r?\n(?=Foto\s*\d+)/i);
  proposals = {};
  blocks.forEach(block=>{
    const lines = block.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(lines.length===0) return;
    const m = lines[0].match(/Foto\s*(\d+)/i);
    if(!m) return;
    const num = parseInt(m[1]);
    const obj = {num, title:"", revisores:"", entrenadores:"", categoria:""};
    lines.slice(1).forEach(line=>{
      const parts = line.split(":");
      if(parts.length<2) return;
      const key = parts[0].toLowerCase();
      const val = parts.slice(1).join(":").trim();
      if(key.includes("título")||key.includes("titulo")) obj.title=val;
      if(key.includes("revisor")) obj.revisores=val;
      if(key.includes("entrenador")) obj.entrenadores=val;
      if(key.includes("categoría")||key.includes("categoria")) obj.categoria=val;
    });
    proposals[num] = obj;
  });


// ✅ Mensaje de confirmación
document.getElementById('proposalsStatus').textContent = "✅ Propuestas subidas correctamente";

// 👉 Generar automáticamente la Sección 5
buildResults();

});

document.getElementById('btnClearProposals').addEventListener('click', ()=>{
  proposals={};
  document.getElementById('proposalsInput').value="";
  document.getElementById('proposalsStatus').textContent="❌ Propuestas borradas";
});


// === Construir la vista final combinada ===
// Se asume que ya existen:
// - files (Sección 1 - imágenes)
// - locations (Sección 3 - ubicaciones)
// - proposals (Sección 4 - textos)

function buildResults(){
  const container = document.getElementById("resultsList");
  container.innerHTML = "";

  Object.values(proposals).forEach((prop, idx)=>{
    const loc = locations.find(l => l.order === prop.num);
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
  ? `https://drive.google.com/uc?export=view&id=${file.id}`
  : "https://via.placeholder.com/200x200?text=Sin+Imagen";

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




 