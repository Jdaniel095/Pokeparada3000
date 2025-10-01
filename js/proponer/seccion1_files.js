document.getElementById("btnConnect").onclick = listDriveFiles;
/* ===== CONFIG ===== */
const API_KEY = "AIzaSyAzq7mmTZTExpbetLRCkbopY5pDPBvOki4";
const FOLDER_ID = "1SykigPCl4e003n6i2_PbopBrq22droo4";
const SHEET_URL = "https://script.google.com/macros/s/AKfycby0mJlQC7FMR18yS_kPLRuUDw3CbaWEFXuzQqGzuT6jkVdF-53TPvCeUW8UaBxRQWpT/exec";

let files = [];
let selected = new Set();       // check azul
let accesoSelected = new Set(); // check naranja

// Imágenes de prueba para test (temporal)
const testFiles = [
  {
    id: "test1",
    name: "Prueba 1",
    thumbnailLink: "https://wallpapers.com/images/hd/eevee-pictures-9pvgmfx7wz4qeyuj.jpg",
    webContentLink: "https://wallpapers.com/images/hd/eevee-pictures-9pvgmfx7wz4qeyuj.jpg"
  },
  {
    id: "test2",
    name: "Prueba 2",
    thumbnailLink: "https://www.shutterstock.com/image-vector/vector-pikachu-on-yellow-background-260nw-2317088997.jpg",
    webContentLink: "https://www.shutterstock.com/image-vector/vector-pikachu-on-yellow-background-260nw-2317088997.jpg"
  },
  {
    id: "test3",
    name: "Prueba 3",
    thumbnailLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SitwRF8aFBgyOkp-K853HhxLSYW8wkecyw&s",
    webContentLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SitwRF8aFBgyOkp-K853HhxLSYW8wkecyw&s"
  },
  {
    id: "test4",
    name: "Prueba 4",
    thumbnailLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZF_P5hyV_zmUTvBU9gtFH2iLrVTLvMamKow&s",
    webContentLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZF_P5hyV_zmUTvBU9gtFH2iLrVTLvMamKow&s"
  }
];



/* === 1. Listar archivos de Drive === */
async function listDriveFiles() {
  let driveFiles = [];

  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType,thumbnailLink,webContentLink)`;
    const res = await fetch(url);
    const data = await res.json();
    driveFiles = data.files || [];
  } catch(err) {
    console.warn("No se pudo cargar Drive, se usarán imágenes de prueba", err);
  }

  // Combinar archivos reales y de prueba
  files = [...driveFiles, ...testFiles];

// Filtrar duplicados por webContentLink
const uniqueFilesMap = {};
files.forEach(f => {
  uniqueFilesMap[f.webContentLink] = f; // ahora filtra por link en vez de ID
});
files = Object.values(uniqueFilesMap);
  // Renderizar lista ya filtrada
  renderFiles();
}




/* === Renderizar lista === */
function renderFiles(){
  const cont = document.getElementById("filesList");
  cont.innerHTML = "";

  files.forEach((f,i)=>{
  const isSel = selected.has(f.id); // azul
  const isAcceso = accesoSelected.has(f.id); // naranja

  const thumb = f.thumbnailLink 
    ? f.thumbnailLink.replace(/=s\d+$/, "=s200") 
    : `https://drive.google.com/uc?export=view&id=${f.id}`;

  const div = document.createElement("div");
  div.className = "file-card"+(isSel?" selected":"");
  div.style.position = "relative"; // importante para los checks

  div.innerHTML = `
    <div class="file-check">${isSel?"✓":""}</div>
    <img src="${thumb}" alt="${f.name}">
    <div class="file-num">#${i+1}</div>
    <div class="file-check-acceso" style="
      position:absolute;
      top:4px;
      right:4px;
      width:20px;
      height:20px;
      border:2px solid orange;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:50%;
      font-size:14px;
      color:white;
      background:${isAcceso?'orange':'white'}">
      ${isAcceso?'✓':''}
    </div>
  `;

  div.onclick = (e)=>{
    if(e.target.className.includes("file-check-acceso")){
      // click en naranja
      if(accesoSelected.has(f.id)) accesoSelected.delete(f.id);
      else accesoSelected.add(f.id);
      // solo un check por foto
      if(selected.has(f.id)) selected.delete(f.id);
    } else {
      // click en azul
      if(selected.has(f.id)) selected.delete(f.id);
      else selected.add(f.id);
      if(accesoSelected.has(f.id)) accesoSelected.delete(f.id);
    }
    renderFiles();
	
	
  };

  cont.appendChild(div);
});

// Actualizar contadores
const counterDiv = document.getElementById("filesCounter");
if(counterDiv){
  const spans = counterDiv.getElementsByTagName("span");
  spans[0].textContent = `Total: ${files.length}`;                   // total fotos
  spans[1].textContent = `Poképaradas: ${selected.size}`;           // check azul
  spans[2].textContent = `Acceso: ${accesoSelected.size}`;          // check naranja
}
}

/* === Botones === */
document.getElementById("btnConnect").onclick = listDriveFiles;
document.getElementById("btnRefresh").onclick = listDriveFiles;
document.getElementById("btnSelectAll").onclick = ()=>{
  files.forEach(f=>selected.add(f.id));
  renderFiles();
};
document.getElementById("btnClearAll").onclick = () => {
  selected.clear();       // limpia el check azul
  accesoSelected.clear(); // limpia el check naranja
  renderFiles();          // vuelve a dibujar las miniaturas
};
 
 
 document.getElementById("btnClearPoke").onclick = () => {
  selected.clear();       // limpia solo las Poképaradas (azul)
  renderFiles();
};

document.getElementById("btnClearAcceso").onclick = () => {
  accesoSelected.clear(); // limpia solo los Accesos (naranja)
  renderFiles();
};



// Al final de Sección1.js
window.accesoSelected = accesoSelected;  // ahora otras secciones pueden acceder