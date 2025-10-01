document.getElementById("btnConnect").onclick = listDriveFiles;
/* ===== CONFIG ===== */
const API_KEY = "AIzaSyAzq7mmTZTExpbetLRCkbopY5pDPBvOki4";
const FOLDER_ID = "1SykigPCl4e003n6i2_PbopBrq22droo4";
const SHEET_URL = "https://script.google.com/macros/s/AKfycby0mJlQC7FMR18yS_kPLRuUDw3CbaWEFXuzQqGzuT6jkVdF-53TPvCeUW8UaBxRQWpT/exec";

let files = [];
let selected = new Set();

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
    const thumb = f.thumbnailLink 
      ? f.thumbnailLink.replace(/=s\d+$/, "=s200") 
      : `https://drive.google.com/uc?export=view&id=${f.id}`;

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
 