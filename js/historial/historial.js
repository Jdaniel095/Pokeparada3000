/* === Historial === */
// Guardar historial en localStorage
function saveHistoryEntry(type, data){
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const entry = {
    id: Date.now(),
    type,       // ejemplo: "collage", "ubicacion", "propuesta"
    data,       // objeto con info
    date: new Date().toLocaleString()
  };
  history.push(entry);
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

// Renderizar historial
function renderHistory(){
  const container = document.getElementById("historyList");
  if(!container) return;

  const history = JSON.parse(localStorage.getItem("history") || "[]");
  container.innerHTML = "";

  if(history.length === 0){
    container.innerHTML = "<p style='color:#777'>No hay historial guardado</p>";
    return;
  }

  history.slice().reverse().forEach(entry=>{
    const card = document.createElement("div");
    card.style.border = "1px solid #ccc";
    card.style.padding = "10px";
    card.style.marginBottom = "8px";
    card.style.borderRadius = "6px";
    card.style.background = "#fafafa";

    card.innerHTML = `
      <strong>${entry.type.toUpperCase()}</strong><br>
      ${entry.date}<br>
      <small>${JSON.stringify(entry.data)}</small>
    `;

    const btnDelete = document.createElement("button");
    btnDelete.textContent = "🗑️";
    btnDelete.onclick = ()=>{
      deleteHistory(entry.id);
    };

    card.appendChild(btnDelete);
    container.appendChild(card);
  });
}

// Eliminar entrada
function deleteHistory(id){
  let history = JSON.parse(localStorage.getItem("history") || "[]");
  history = history.filter(e=>e.id !== id);
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

// Limpiar todo el historial
function clearHistory(){
  localStorage.removeItem("history");
  renderHistory();
}

// Llamar al render al cargar
document.addEventListener("DOMContentLoaded", renderHistory);
