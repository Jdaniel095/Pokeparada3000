// proponer/main.js
const secciones = [
  "seccion1_files/files.js",
  "seccion2_collage/collage.js",
  "seccion3_locations/locations.js",
  "seccion4_proposals/proposals.js",
  "seccion5_results/results.js"
];

secciones.forEach(file => {
  const script = document.createElement("script");
  script.src = file;
  script.defer = true;
  document.body.appendChild(script);
});
