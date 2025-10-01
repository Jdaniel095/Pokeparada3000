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
    img.src = f.thumbnailLink 
      ? f.thumbnailLink.replace(/=s\d+$/, "=s400") 
      : `https://drive.google.com/uc?export=view&id=${f.id}`;
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