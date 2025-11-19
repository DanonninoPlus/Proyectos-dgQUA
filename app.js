// app.js
// Versión con agrupación por CONTINENTE → PAÍS → PROYECTOS

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

let proyectos = loadFromStorage();

// Inicialización
renderList();
populateResponsibles();
attachEvents();

/* ---------- Cargar / Guardar ---------- */

function loadFromStorage(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch(e){
    console.error("Error parseando localStorage:", e);
    return [];
  }
}

function saveToStorage(){
  localStorage.setItem(LS_KEY, JSON.stringify(proyectos));
  populateResponsibles();
}

/* ---------- Helpers ---------- */

function cryptoRandomId(){
  return Math.random().toString(36).slice(2, 9);
}

function escapeHtml(text){
  if(!text) return "";
  return text.replaceAll("&", "&amp;")
             .replaceAll("<", "&lt;")
             .replaceAll(">", "&gt;")
             .replaceAll('"', "&quot;");
}

/* ---------- Render List (AGRUPADO) ---------- */

function renderList() {
    const q = searchInput.value.trim().toLowerCase();
    const sectorFilter = filterResponsible.value;
    const statusFilter = filterStatus.value;

    // 1. Filtrado
    let filtered = proyectos.filter(p => {
        const matchQ = !q || (p.Nombredelproyecto + " " + p.status + " " + p.Pais + " " + p.Continente).toLowerCase().includes(q);
        const matchSector = !sectorFilter || p.Sector === sectorFilter;
        const matchStatus = !statusFilter || p.status === statusFilter;
        return matchQ && matchSector && matchStatus;
    });

    // 2. Agrupar por continente → país
    // Estructura: { 'Asia': { 'Japon': [p1, p2], 'China': [p3] }, ... }
    const grupos = {};
    if (filtered.length === 0) {
        projectList.innerHTML = `<div class="p-4 bg-white rounded shadow text-sm">No hay proyectos.</div>`;
        return;
    }

    filtered.forEach(p => {
        const continente = p.Continente || 'Sin Continente';
        const pais = p.Pais || 'Sin País';

        if (!grupos[continente]) grupos[continente] = {};
        if (!grupos[continente][pais]) grupos[continente][pais] = [];
        grupos[continente][pais].push(p);
    });

    // 3. Renderizado (Continente > País > Proyecto)
    projectList.innerHTML = "";

    // Iterar Continentes
    Object.keys(grupos).sort().forEach(continente => {
        
        // Contenedor principal del Continente
        const contDiv = document.createElement("div");
        contDiv.className = "mb-4 bg-gray-100 rounded shadow";

        // Header del Continente (Acordeón 1)
        const contHeader = document.createElement("button");
        contHeader.className = "w-full text-left px-4 py-3 text-lg font-bold bg-gray-200 rounded acordeon-btn";
        contHeader.innerHTML = `🌍 ${continente} <span class="text-sm text-gray-600 ml-2">(clic para expandir)</span>`;
        
        // Contenido Colapsable del Continente
        const contContent = document.createElement("div");
        contContent.className = "panel hidden p-4";

        contDiv.appendChild(contHeader);
        contDiv.appendChild(contContent);
        
        // Iterar Países dentro del Continente
        Object.keys(grupos[continente]).sort().forEach(pais => {
            
            // Contenedor del País
            const paisDiv = document.createElement("div");
            paisDiv.className = "ml-4 mb-3 border-l-2 border-indigo-400 pl-3";

            // Header del País (Acordeón 2)
            const paisHeader = document.createElement("button");
            paisHeader.className = "w-full text-left font-semibold text-indigo-700 py-2 acordeon-btn";
            paisHeader.innerHTML = `📍 ${pais} <span class="text-sm text-gray-500 ml-2">(${grupos[continente][pais].length} proyectos)</span>`;
            
            // Contenido Colapsable del País
            const paisContent = document.createElement("div");
            paisContent.className = "panel hidden ml-4";
            
            paisDiv.appendChild(paisHeader);
            paisDiv.appendChild(paisContent);
            
            // Iterar Proyectos dentro del País
            grupos[continente][pais].forEach((p) => {
                const card = document.createElement("div");
                // La tarjeta individual ya no tiene el shadow y border completo,
                // ya que está dentro de la estructura de País.
                card.className = "bg-white rounded shadow-sm mb-2";

                // Estructura del Proyecto (Botón Acordeón)
                card.innerHTML = `
                    <button class="w-full text-left px-4 py-3 acordeon-btn flex justify-between items-center">
                      <div>
                        <div class="font-semibold">${escapeHtml(p.Nombredelproyecto)}</div>
                        <div class="text-xs text-gray-700">
                          <span class="mr-3"> <strong>Sector:</strong> ${escapeHtml(p.Sector)} </span>
                          <span class="mr-3"> <strong>Estado:</strong> ${p.status} </span>
                          <span class="mr-3"> <strong>Fechas:</strong> ${p.Fechadeinicio} - ${p.Fechadetermino} </span>
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
            
            contContent.appendChild(paisDiv);
        });
        
        projectList.appendChild(contDiv);
    });

    // 4. Adjuntar eventos (funciona para todos los niveles de acordeón)
    attachAccordionEvents();
    attachEditDeleteEvents();
}
/* ---------- Accordion ---------- */

function attachAccordionEvents(){
  const accBtns = document.querySelectorAll(".acordeon-btn");
  accBtns.forEach(btn => {
    btn.onclick = () => {
      const panel = btn.nextElementSibling;
      panel.classList.toggle("hidden");
    };
  });
}

/* ---------- Edit / Delete ---------- */

function attachEditDeleteEvents(){
  document.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = e => openEditModal(e.target.dataset.id);
  });

  document.querySelectorAll(".btn-delete").forEach(b => {
    b.onclick = e => {
      if(confirm("¿Eliminar este proyecto?")){
        proyectos = proyectos.filter(p => p.id !== e.target.dataset.id);
        saveToStorage();
        renderList();
      }
    };
  });
}

/* ---------- Eventos ---------- */

function attachEvents(){
  searchInput.addEventListener("input", renderList);
  filterResponsible.addEventListener("change", renderList);
  filterStatus.addEventListener("change", renderList);

  btnAddProject.addEventListener("click", openModalForNew);
  btnCancel.addEventListener("click", closeModal);

  projectForm.addEventListener("submit", saveProject);

  btnExportPDF.addEventListener("click", exportPDF);
  btnExportXLS.addEventListener("click", exportXLS);
  btnImportJSON.addEventListener("click", importJSON);
}

/* ---------- Modal ---------- */

function openModalForNew(){
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

function openEditModal(id){
  const p = proyectos.find(x => x.id === id);
  if(!p) return;

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

function showModal(){
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function closeModal(){
  modal.classList.add("hidden");
  modal.style.display = "none";
}

function saveProject(ev){
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

  if(id){
    proyectos = proyectos.map(p => p.id === id ? data : p);
  } else {
    proyectos.unshift(data);
  }

  saveToStorage();
  closeModal();
  renderList();
}

/* ---------- Exportar PDF ---------- */

function exportPDF(){
  alert("Export PDF pendiente de ajuste si quieres que respete la agrupación. Te lo hago si lo deseas ❤️");
}

/* ---------- Exportar Excel ---------- */

function exportXLS(){
  alert("Lo ajusto al nuevo formato si lo deseas.");
}

/* ---------- Importar JSON ---------- */

function importJSON(){
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";

  fileInput.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if(Array.isArray(parsed)){
          proyectos = parsed;
          saveToStorage();
          renderList();
          alert("Importación realizada.");
        } else {
          alert("JSON inválido.");
        }
      } catch(err){
      }
    };

    reader.readAsText(file);
  };

  fileInput.click();
}

/* ---------- Populate sector ---------- */

function populateResponsibles(){
  const sectores = Array.from(new Set(proyectos.map(p => p.Sector))).filter(x => x);
  
  filterResponsible.innerHTML = `<option value="">Filtrar por Sector</option>`;

  sectores.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    filterResponsible.appendChild(opt);
  });
}


