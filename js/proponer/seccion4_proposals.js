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