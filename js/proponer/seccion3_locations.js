document.getElementById("btnGenerateCollage").onclick = generateCollage;
document.getElementById("btnDownloadCollage").onclick = downloadCollage;

window.locations = [];
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
   window.locations.push(location);
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