// app.js
// Versión con carga desde JSON externo + fallback a localStorage
// Agrupación por CONTINENTE → PAÍS → PROYECTOS

/* ---------- Estructura de proyecto ----------
{
  id, Nombredelproyecto, Objetivo, Sector, Pais, Continente,
  Fechadeinicio, Fechadetermino, status, notas, createdAt
}
----------------------------------------------*/

const LS_KEY = "dg_proyectos_v2";

// DOM
const projectList = document.getElementById("projectList");
const searchInput = document.getElementById("searchInput");
const filterResponsible = document.getElementById("filterResponsible");
const filterStatus = document.getElementById("filterStatus");
const btnAddProject = document.getElementById("btnAddProject");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const projectForm = document.getElementById("projectForm");
const btnCancel = document.getElementById("btnCancel");

const btnExportPDF = document.getElementById("btnExportPDF");
const btnExportXLS = document.getElementById("btnExportXLS");
const btnImportJSON = document.getElementById("btnImportJSON");
const printArea = document.getElementById("printArea");

// Form fields
const projId = document.getElementById("projId");
const projNombredelproyecto = document.getElementById("projNombredelproyecto");
const projSector = document.getElementById("projSector");
const projPais = document.getElementById("projPais");
const projContinente = document.getElementById("projContinente");
const projFechadeinicio = document.getElementById("projFechadeinicio");
const projFechadetermino = document.getElementById("projFechadetermino");
const projStatus = document.getElementById("projStatus");
const projObjetivo = document.getElementById("projObjetivo");
const projNotas = document.getElementById("projNotas");

let proyectos = [];
let normatecaDocs = [];

const PAISES_CON_SUBTIPO = ["Japón", "Chile", "Estados Unidos", "Noruega"];
const CAMPO_SUBTIPO = "Tipo de proyecto";


/* ============================================================
   🔵 1. FUNCIÓN PARA CARGAR JSON EXTERNO DESDE GITHUB
   ============================================================*/
async function loadFromJsonUrl() {
  try {

    const url = "https://raw.githubusercontent.com/DanonninoPlus/Proyectos-dg/main/proyectos.json";

    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar el JSON externo");

    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("El JSON debe ser un arreglo");

    console.log("JSON externo cargado correctamente");
    return data;

  } catch (err) {
    console.warn("No se pudo cargar el JSON externo:", err);
    return [];
  }
}

/* ============================================================
   🔵 1.1. CARGA DE NORMATECA DESDE JSON EXTERNO DESDE GITHUB
   ============================================================*/

async function loadnormatecaFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/Proyectos-dg/main/normateca.json";

    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar normateca.json");

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("El JSON debe ser un arreglo");

    return data;
  } catch (err) {
    console.warn("Error cargando Normateca:", err);
    return [];
  }
}


/* ============================================================
   🔵 2. LOCALSTORAGE
   ============================================================*/
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error parseando localStorage:", e);
    return [];
  }
}

function saveToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(proyectos));
  populateResponsibles();
}

/* ============================================================
   🔵 3. INICIALIZACIÓN (JSON EXTERNO → LOCALSTORAGE → RENDER)
   ============================================================*/
async function init() {
  console.log("Iniciando app…");

  // 1️⃣ Intentar cargar desde GitHub
  const proyectosGithub = await loadFromJsonUrl();

  if (proyectosGithub.length > 0) {
    console.log("Se cargaron proyectos desde GitHub");
    proyectos = proyectosGithub;

    // Sobrescribe el LocalStorage con los datos correctos
    saveToStorage();
  } 
  else {
    console.warn("No se pudo cargar GitHub, usando LocalStorage…");
    proyectos = loadFromStorage();
  }

    // 🔵 Cargar NORMATECA
  normatecaDocs = await loadnormatecaFromJsonUrl();


  // Renderizar la app
  renderList();
  populateResponsibles();
  attachEvents();
}

// 🚀 Ejecutar inicialización
init();

/* ============================================================
   🔵 4. HELPERS
   ============================================================*/
function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 9);
}

function escapeHtml(text) {
  if (!text) return "";
  return text.replaceAll("&", "&amp;")
             .replaceAll("<", "&lt;")
             .replaceAll(">", "&gt;")
             .replaceAll('"', "&quot;");
}

/* ============================================================
   🔵 5. RENDER LISTA AGRUPADA
   ============================================================*/
function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const sectorFilter = filterResponsible.value;
  const statusFilter = filterStatus.value;

  let filtered = proyectos.filter(p => {
    const matchQ = !q || (p.Nombredelproyecto + " " + p.status + " " + p.Pais + " " + p.Continente)
                      .toLowerCase().includes(q);
// ⚠️ CAMBIO CLAVE AQUÍ: Lógica para múltiples sectores
    const matchSector = !sectorFilter || (
      // Verificamos si la cadena de sectores del proyecto (p.Sector)
      // contiene el sector que estamos filtrando (sectorFilter).
      // Usamos toUpperCase/toLowerCase para una búsqueda sin distinción de mayúsculas/minúsculas.
      p.Sector && p.Sector.toUpperCase().includes(sectorFilter.toUpperCase())
    );
    
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchQ && matchSector && matchStatus;
  });

  const grupos = {};
  if (filtered.length === 0) {
    projectList.innerHTML = `<div class="p-4 bg-white rounded shadow text-sm">No hay proyectos.</div>`;
    return;
  }

filtered.forEach(p => {
  const c = p.Continente || "Sin Continente";
  const pais = p.Pais || "Sin País";

  if (!grupos[c]) grupos[c] = {};

  // 📌 Países con subgrupos (Japón, Chile, etc.)
  if (PAISES_CON_SUBTIPO.includes(pais)) {
  const subtipo = p[CAMPO_SUBTIPO] || "Sin subtipo";

  if (!grupos[c][pais]) grupos[c][pais] = {};
  if (!grupos[c][pais][subtipo]) grupos[c][pais][subtipo] = [];

  grupos[c][pais][subtipo].push(p);
} else {
  if (!grupos[c][pais]) grupos[c][pais] = [];
  grupos[c][pais].push(p);
}

});


  projectList.innerHTML = "";

  Object.keys(grupos).sort().forEach(continente => {
    const contDiv = document.createElement("div");
    contDiv.className = "mb-4 bg-gray-100 rounded shadow";

    const contHeader = document.createElement("button");
    contHeader.className = "w-full text-left px-4 py-3 text-lg font-bold bg-gray-200 rounded acordeon-btn";
    contHeader.innerHTML = `🌍 ${continente} <span class="text-sm text-gray-600 ml-2">(clic para expandir)</span>`;

    const contContent = document.createElement("div");
    contContent.className = "panel hidden p-4";

    contDiv.appendChild(contHeader);
    contDiv.appendChild(contContent);

    Object.keys(grupos[continente]).sort().forEach(pais => {
      const paisDiv = document.createElement("div");
      paisDiv.className = "ml-4 mb-3 border-l-2 border-indigo-400 pl-3";

      const paisHeader = document.createElement("button");
      paisHeader.className = "w-full text-left font-semibold text-indigo-700 py-2 acordeon-btn";
      let totalProjects = 0;
const dataPais = grupos[continente][pais];

if (PAISES_CON_SUBTIPO.includes(pais) && typeof dataPais === "object" && !Array.isArray(dataPais)) {
  totalProjects = Object.values(dataPais).reduce((sum, arr) => sum + arr.length, 0);
} else {
  totalProjects = dataPais.length;
}


paisHeader.innerHTML = `📍 ${pais} <span class="text-sm text-gray-500 ml-2">(${totalProjects} proyectos)</span>`;


      const paisContent = document.createElement("div");
      paisContent.className = "panel hidden ml-4";

      paisDiv.appendChild(paisHeader);
      paisDiv.appendChild(paisContent);


// 🟣 Países con subniveles (Japón, Chile, Estados Unidos, Noruega)
if (PAISES_CON_SUBTIPO.includes(pais) && typeof dataPais === "object" && !Array.isArray(dataPais)) {


    Object.keys(dataPais).sort().forEach(sub => {
        const subDiv = document.createElement("div");
        subDiv.className = "ml-6 mb-2 border-l-2 border-green-400 pl-3";

        const subHeader = document.createElement("button");
        subHeader.className = "w-full text-left font-semibold text-green-700 py-2 acordeon-btn";
        subHeader.innerHTML = `🟩 ${sub} <span class="text-sm text-gray-500 ml-2">(${dataPais[sub].length} proyectos)</span>`;

        const subContent = document.createElement("div");
        subContent.className = "panel hidden ml-4";

        subDiv.appendChild(subHeader);
        subDiv.appendChild(subContent);

        dataPais[sub].forEach(p => {
            const card = document.createElement("div");
            card.className = "bg-white rounded shadow-sm mb-2";

            card.innerHTML = `
              <button class="w-full text-left px-4 py-3 acordeon-btn flex justify-between items-center">
                <div>
                  <div class="font-semibold">${escapeHtml(p.Nombredelproyecto)}</div>
                  <div class="text-xs text-gray-700">
                  <strong>Sector:</strong> ${escapeHtml(p.Sector)} —
                  <strong>Estado:</strong> ${p.status}<br>
                  <strong>Fechas:</strong> ${p.Fechadeinicio || "—"} / ${p.Fechadetermino || "—"}
                </div>
                </div>
                <div class="text-sm">+ ver</div>
              </button>

              <div class="panel px-4 py-3 border-t hidden">
                <p><strong>Objetivo:</strong> ${escapeHtml(p.Objetivo || "")}</p>
                <p class="mt-2"><strong>Notas:</strong> ${escapeHtml(p.notas || "")}</p>

                <div class="mt-3 flex gap-2">
                  <button data-id="${p.id}" class="btn-edit px-2 py-1 border rounded text-sm">Editar</button>
                  <button data-id="${p.id}" class="btn-delete px-2 py-1 border rounded text-sm text-red-600">Eliminar</button>
                </div>
              </div>
            `;

            subContent.appendChild(card);
        });

        paisContent.appendChild(subDiv);
    });

} else {

    // 🌍 País normal (como actualmente)
    dataPais.forEach(p => {
        const card = document.createElement("div");
        card.className = "bg-white rounded shadow-sm mb-2";

        card.innerHTML = `
          <button class="w-full text-left px-4 py-3 acordeon-btn flex justify-between items-center">
            <div>
              <div class="font-semibold">${escapeHtml(p.Nombredelproyecto)}</div>
              <div class="text-xs text-gray-700">
              <strong>Sector:</strong> ${escapeHtml(p.Sector)} —
              <strong>Estado:</strong> ${p.status}<br>
              <strong>Fechas:</strong> ${p.Fechadeinicio || "—"} / ${p.Fechadetermino || "—"}
            </div>
            </div>
            <div class="text-sm">+ ver</div>
          </button>

          <div class="panel px-4 py-3 border-t hidden">
            <p><strong>Objetivo:</strong> ${escapeHtml(p.Objetivo || "")}</p>
            <p class="mt-2"><strong>Notas:</strong> ${escapeHtml(p.notas || "")}</p>

            <div class="mt-3 flex gap-2">
              <button data-id="${p.id}" class="btn-edit px-2 py-1 border rounded text-sm">Editar</button>
              <button data-id="${p.id}" class="btn-delete px-2 py-1 border rounded text-sm text-red-600">Eliminar</button>
            </div>
          </div>
        `;
        paisContent.appendChild(card);
    });
}
      contContent.appendChild(paisDiv);
    });

    projectList.appendChild(contDiv);
  });

  attachAccordionEvents();
  attachEditDeleteEvents();
}

/* ============================================================
   🔵 5.1 RENDER NORMATECA (DOCUMENTOS)
   ============================================================*/
function renderNormateca() {

  const contenedor = document.getElementById("normatecaList");

  if (!normatecaDocs || normatecaDocs.length === 0) {
    contenedor.innerHTML = `
      <div class="p-4 bg-white rounded shadow">
        No hay documentos disponibles.
      </div>`;
    return;
  }

  contenedor.innerHTML = "";

  normatecaDocs.forEach(doc => {
    const card = document.createElement("div");
    card.className = "bg-white rounded shadow-sm p-4 mb-3";

    card.innerHTML = `
      <div class="font-semibold text-lg">${escapeHtml(doc.titulo)}</div>

      <div class="text-sm text-gray-600 mt-1">
        <strong>Tipo:</strong> ${escapeHtml(doc.tipo)} ·
        <strong>Año:</strong> ${doc.anio} ·
        <strong>País:</strong> ${escapeHtml(doc.pais)}
      </div>

      <p class="text-sm mt-2">${escapeHtml(doc.descripcion || "")}</p>

      <a href="${doc.archivo}" target="_blank"
         class="inline-block mt-3 px-3 py-1 bg-indigo-600 text-white rounded text-sm">
        Descargar documento
      </a>
    `;

    contenedor.appendChild(card);
  });
}

/* ============================================================
   🔵 6. ACCORDION
   ============================================================*/
function attachAccordionEvents() {
  const accBtns = document.querySelectorAll(".acordeon-btn");
  accBtns.forEach(btn => {
    btn.onclick = () => {
      const panel = btn.nextElementSibling;
      panel.classList.toggle("hidden");
    };
  });
}

/* ============================================================
   🔵 7. EDITAR / ELIMINAR
   ============================================================*/
function attachEditDeleteEvents() {
  document.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = e => openEditModal(e.target.dataset.id);
  });

  document.querySelectorAll(".btn-delete").forEach(b => {
    b.onclick = e => {
      if (confirm("¿Eliminar este proyecto?")) {
        proyectos = proyectos.filter(p => p.id !== e.target.dataset.id);
        saveToStorage();
        renderList();
      }
    };
  });
}

/* ============================================================
   🔵 8. EVENTOS
   ============================================================*/
function attachEvents() {
  searchInput.addEventListener("input", renderList);
  filterResponsible.addEventListener("change", renderList);
  filterStatus.addEventListener("change", renderList);

  btnAddProject.addEventListener("click", openModalForNew);
  btnCancel.addEventListener("click", closeModal);

  projectForm.addEventListener("submit", saveProject);

  btnExportPDF.addEventListener("click", exportPDF);
  btnExportXLS.addEventListener("click", exportXLS);
  btnImportJSON.addEventListener("click", importJSON);

/* ============================================================
     🔵 EVENTOS DE PESTAÑAS
     ============================================================*/

const tabProyectos = document.getElementById("tabProyectos");
const tabnormateca = document.getElementById("tabnormateca");

tabProyectos.addEventListener("click", () => {

  document.getElementById("projectList").classList.remove("hidden");
  document.getElementById("searchInput").parentElement.parentElement.classList.remove("hidden");
  document.getElementById("normatecaSection").classList.add("hidden");

  tabProyectos.classList.add("bg-indigo-600", "text-white");
  tabnormateca.classList.remove("bg-indigo-600", "text-white");
});

tabnormateca.addEventListener("click", () => {

  document.getElementById("projectList").classList.add("hidden");
  document.getElementById("searchInput").parentElement.parentElement.classList.add("hidden");
  document.getElementById("normatecaSection").classList.remove("hidden");

  renderNormateca(); // 👈 AQUÍ se pinta la Normateca

  tabnormateca.classList.add("bg-indigo-600", "text-white");
  tabProyectos.classList.remove("bg-indigo-600", "text-white");
});
}
/* ============================================================
   🔵 9. MODAL
   ============================================================*/
function openModalForNew() {
  modalTitle.textContent = "Nuevo proyecto";

  projId.value = "";
  projNombredelproyecto.value = "";
  projSector.value = "";
  projPais.value = "";
  projContinente.value = "";
  projFechadeinicio.value = "";
  projFechadetermino.value = "";
  projStatus.value = "Planeación";
  projObjetivo.value = "";
  projNotas.value = "";

  showModal();
}

function openEditModal(id) {
  const p = proyectos.find(x => x.id === id);
  if (!p) return;

  modalTitle.textContent = "Editar proyecto";

  projId.value = p.id;
  projNombredelproyecto.value = p.Nombredelproyecto;
  projSector.value = p.Sector;
  projPais.value = p.Pais;
  projContinente.value = p.Continente;
  projFechadeinicio.value = p.Fechadeinicio;
  projFechadetermino.value = p.Fechadetermino;
  projStatus.value = p.status;
  projObjetivo.value = p.Objetivo;
  projNotas.value = p.notas;

  showModal();
}

function showModal() {
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function closeModal() {
  modal.classList.add("hidden");
  modal.style.display = "none";
}

function saveProject(ev) {
  ev.preventDefault();

  const id = projId.value;

  const data = {
    id: id || cryptoRandomId(),
    Nombredelproyecto: projNombredelproyecto.value.trim(),
    Sector: projSector.value.trim(),
    Pais: projPais.value.trim(),
    Continente: projContinente.value.trim(),
    Fechadeinicio: projFechadeinicio.value.trim(),
    Fechadetermino: projFechadetermino.value.trim(),
    status: projStatus.value.trim(),
    Objetivo: projObjetivo.value.trim(),
    notas: projNotas.value.trim(),
    createdAt: id ? proyectos.find(p => p.id === id).createdAt : new Date().toISOString()
  };

  if (id) {
    proyectos = proyectos.map(p => p.id === id ? data : p);
  } else {
    proyectos.unshift(data);
  }

  saveToStorage();
  closeModal();
  renderList();
}

/* ============================================================
   🔵 10. EXPORTACIONES
   ============================================================*/

                            /* EXPORTACIÓN EN PDF */
function exportPDF() {
  // Construimos HTML limpio y ordenado
  let html = `
    <div style="font-family: Arial;">
      <h1 style="text-align:center; margin-bottom:20px;">Listado de Proyectos — DG Cooperación</h1>
  `;

  const grupos = {};

  // Agrupación igual que en pantalla
  proyectos.forEach(p => {
    const c = p.Continente || "Sin Continente";
    const pais = p.Pais || "Sin País";

    if (!grupos[c]) grupos[c] = {};

 // Países con subtipo (Japón, Chile)
  if (PAISES_CON_SUBTIPO.includes(pais)) {

      const subtipo = p["Tipo de proyecto"] || "Sin subtipo";
      if (!grupos[c][pais]) grupos[c][pais] = {};
      if (!grupos[c][pais][subtipo]) grupos[c][pais][subtipo] = [];
      grupos[c][pais][subtipo].push(p);
    } else {
      if (!grupos[c][pais]) grupos[c][pais] = [];
      grupos[c][pais].push(p);
    }
  });

  // Construcción del HTML final
  Object.keys(grupos).sort().forEach(cont => {
    html += `<h2 style="background:#eee;padding:8px;font-size:20px;">🌍 ${cont}</h2>`;

    Object.keys(grupos[cont]).sort().forEach(pais => {
      const dataPais = grupos[cont][pais];

      html += `<h3 style="margin-left:10px;color:#333;font-size:18px;">📍 ${pais}</h3>`;

      // Subniveles para países con subtipo
      if (PAISES_CON_SUBTIPO.includes(pais) && typeof dataPais === "object" && !Array.isArray(dataPais)) {


        Object.keys(dataPais).sort().forEach(sub => {
          html += `
            <h4 style="margin-left:20px;color:#228b22;font-size:16px;">
              🟩 ${sub}
            </h4>
          `;

          dataPais[sub].forEach(p => {
            html += `
              <div style="margin-left:30px;margin-bottom:12px;padding:10px;
                          border:1px solid #ccc;border-radius:6px;">
                <strong>${escapeHtml(p.Nombredelproyecto)}</strong><br>
                <small><b>Sector:</b> ${escapeHtml(p.Sector || "")}</small><br>
                <small><b>Estatus:</b> ${p.status}</small><br>
                <small><b>Fechas:</b> ${p.Fechadeinicio} - ${p.Fechadetermino}</small><br>
                <small><b>Objetivo:</b> ${escapeHtml(p.Objetivo || "")}</small><br>
                <small><b>Notas:</b> ${escapeHtml(p.notas || "")}</small>
              </div>
            `;
          });
        });

      } else {
        // País normal
        dataPais.forEach(p => {
          html += `
            <div style="margin-left:20px;margin-bottom:12px;padding:10px;
                        border:1px solid #ccc;border-radius:6px;">
              <strong>${escapeHtml(p.Nombredelproyecto)}</strong><br>
              <small><b>Sector:</b> ${escapeHtml(p.Sector || "")}</small><br>
              <small><b>Estatus:</b> ${p.status}</small><br>
              <small><b>Fechas:</b> ${p.Fechadeinicio} - ${p.Fechadetermino}</small><br>
              <small><b>Objetivo:</b> ${escapeHtml(p.Objetivo || "")}</small><br>
              <small><b>Notas:</b> ${escapeHtml(p.notas || "")}</small>
            </div>
          `;
        });
      }
    });
  });

  html += `</div>`;

  // Cargar contenido en printArea
  printArea.innerHTML = html;

  // Configuración del PDF (estandarizada)
  const opt = {
    margin: 0.5,
    filename: "Proyectos_DG.pdf",
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  };

  html2pdf().set(opt).from(printArea).save();
}

/* ============================================================
   🔵 EXPORTAR PROYECTOS A EXCEL
   ============================================================*/

function exportXLS() {
  // Crear una copia limpia
  const dataToExport = proyectos.map(p => ({
    ID: p.id,
    Proyecto: p.Nombredelproyecto,
    Sector: p.Sector,
    País: p.Pais,
    Continente: p.Continente,
    Inicio: p.Fechadeinicio,
    Término: p.Fechadetermino,
    Estatus: p.status,
    Objetivo: p.Objetivo,
    Notas: p.notas,
    Creado: p.createdAt
  }));

  // Convertimos el JSON → hoja de Excel
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // Creamos libro
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Proyectos");

  // Descargar archivo
  XLSX.writeFile(workbook, "Proyectos_DG.xlsx");
}


/* ============================================================
   🔵 11. IMPORTAR JSON
   ============================================================*/
function importJSON() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";

  fileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed)) {
          proyectos = parsed;
          saveToStorage();
          renderList();
          alert("Importación realizada.");
        } else {
          alert("JSON inválido.");
        }
      } catch (err) {}
    };

    reader.readAsText(file);
  };

  fileInput.click();
}

/* ============================================================
   🔵 12. POPULAR SECTOR (CORREGIDA)
   ============================================================*/
function populateResponsibles() {
  // 1. Recolectar todos los sectores, dividiendo las cadenas por coma
  const allSectors = [];
  proyectos.forEach(p => {
     if (p.Sector) {
      // Dividimos por coma, limpiamos espacios y filtramos cadenas vacías
      const sectoresProyecto = p.Sector.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
 
      allSectors.push(...sectoresProyecto);
    }
  });

  // 2. Obtener una lista de sectores únicos y ordenarlos
  const uniqueSectores = Array.from(new Set(allSectors)).sort();

  filterResponsible.innerHTML = `<option value="">Filtrar por Sector</option>`;

  // 3. Llenar el desplegable
  uniqueSectores.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    filterResponsible.appendChild(opt);
  });
}
