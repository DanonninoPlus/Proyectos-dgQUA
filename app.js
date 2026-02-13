// app.js - Versión UI Mejorada (DG Cooperación)

const LS_KEY = "dg_proyectos_v2";

// DOM Elements
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

// ===== REPORTES · WORD POR PAÍS =====
const btnExportWordPais = document.getElementById("btnExportWordPais");
const bottomSheetPais = document.getElementById("bottomSheetPais");
const listaPaises = document.getElementById("listaPaises");
const searchPais = document.getElementById("searchPais");
const btnCancelarPais = document.getElementById("btnCancelarPais");
const btnAceptarPais = document.getElementById("btnAceptarPais");

let paisSeleccionado = null;


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
let investigaciones = [];
let capacitaciones = [];



const PAISES_CON_SUBTIPO = ["Japón", "Chile", "Estados Unidos", "Noruega"];
const CAMPO_SUBTIPO = "Tipo de proyecto";


// ===== GESTIÓN: TABS =====
const tabCapacitaciones = document.getElementById("tabCapacitaciones");
const tabInvestigacion = document.getElementById("tabInvestigacion");

const gestionCapacitaciones = document.getElementById("gestionCapacitaciones");
const gestionInvestigacion = document.getElementById("gestionInvestigacion");


/* ============================================================
   🔵 1. CARGA DE DATOS
   ============================================================*/
async function loadFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/proyectos.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar el JSON externo");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Error cargando proyectos:", err);
    return [];
  }
}

async function loadnormatecaFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/normateca.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar normateca.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Error cargando Normateca:", err);
    return [];
  }
}


async function loadInvestigacionFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/investigacion.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar investigacion.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Error cargando Investigación:", err);
    return [];
  }
}



async function loadCapacitacionesFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/capacitaciones.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar capacitaciones.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Error cargando Capacitaciones:", err);
    return [];
  }
}





function loadFromStorage() {
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(proyectos));
  populateResponsibles();
}

/* ============================================================
   🔵 2. INICIALIZACIÓN
   ============================================================*/
async function init() {
  const proyectosGithub = await loadFromJsonUrl();
  if (proyectosGithub.length > 0) {
    proyectos = proyectosGithub;
    saveToStorage();
  } else {
    proyectos = loadFromStorage();
  }
  normatecaDocs = await loadnormatecaFromJsonUrl();
  investigaciones = await loadInvestigacionFromJsonUrl();
  capacitaciones = await loadCapacitacionesFromJsonUrl();



  renderList();
  populateResponsibles();
  attachEvents();
}

init();

/* ============================================================
   🔵 3. HELPERS
   ============================================================*/
function cryptoRandomId() { return Math.random().toString(36).slice(2, 9); }
function escapeHtml(text) {
  if (!text) return "";
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}


//BottomSheet País - ABRIR Y CERRAR EL BOTTOM SHEET

function abrirBottomSheetPais() {
  paisSeleccionado = null;
  renderListaPaises();
  bottomSheetPais.classList.remove("hidden");
}

function cerrarBottomSheetPais() {
  bottomSheetPais.classList.add("hidden");
  searchPais.value = "";
}

//BottomSheet País - Obtener la lista de los países

function obtenerPaisesUnicos() {
  const set = new Set();
  proyectos.forEach(p => {
    if (p.Pais) set.add(p.Pais.trim());
  });
  return Array.from(set).sort();
}

//BottomSheet País - AGREGA EL RENDER DEL BOTTOM SHEET

function renderListaPaises() {
  const filtro = searchPais.value.toLowerCase();
  listaPaises.innerHTML = "";

  const paises = obtenerPaisesUnicos().filter(p =>
    p.toLowerCase().includes(filtro)
  );

  if (!paises.length) {
    listaPaises.innerHTML = `
      <div class="text-center text-slate-400 text-sm italic py-6">
        No se encontraron países
      </div>`;
    return;
  }

  paises.forEach(pais => {
    const item = document.createElement("button");
    item.className = `
      w-full flex items-center justify-between px-4 py-3 rounded-xl
      border text-sm font-semibold
      ${paisSeleccionado === pais
        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
        : "border-slate-200 bg-white text-slate-700"}
    `;

    item.innerHTML = `
      <span>${pais}</span>
      <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${paisSeleccionado === pais ? "border-indigo-600" : "border-slate-300"}">
        ${paisSeleccionado === pais ? "●" : ""}
      </span>
    `;

    item.onclick = () => {
      paisSeleccionado = pais;
      renderListaPaises();
    };

    listaPaises.appendChild(item);
  });
}



/* ============================================================
   🔵 4. RENDER LISTA (DISEÑO MEJORADO)
   ============================================================*/
function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const sectorFilter = filterResponsible.value;
  const statusFilter = filterStatus.value;

  // 1. Primero filtras los proyectos
  let filtered = proyectos.filter(p => {
    const matchQ = !q || (p.Nombredelproyecto + " " + p.status + " " + p.Pais + " " + p.Continente).toLowerCase().includes(q);
    const matchSector = !sectorFilter || (p.Sector && p.Sector.toUpperCase().includes(sectorFilter.toUpperCase()));
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchQ && matchSector && matchStatus;
  });

   // 2. ACTUALIZAS EL CONTADOR (Esto es lo que hace la magia)
  const counterEl = document.getElementById("projectCounter");
  if (counterEl) {
      counterEl.innerHTML = `${filtered.length} Proyectos encontrados`;
  }

  // 3. Sigues con el resto del renderizado
  const grupos = {};
  const conteoContinente = {};
  const conteoPais = {};

  if (filtered.length === 0) {
    projectList.innerHTML = `<div class="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">No se encontraron proyectos</div>`;
    return;
  }

  filtered.forEach(p => {
    const c = (p.Continente || "Sin Continente").trim();
    const pais = (p.Pais || "Sin País").trim();

    
    // 🔢 Conteo por continente
conteoContinente[c] = (conteoContinente[c] || 0) + 1;

// 🔢 Conteo por país (clave única continente|país)
const clavePais = `${c}|${pais}`;
conteoPais[clavePais] = (conteoPais[clavePais] || 0) + 1;



    if (!grupos[c]) grupos[c] = {};
    if (PAISES_CON_SUBTIPO.includes(pais)) {
      const subtipo = p[CAMPO_SUBTIPO] || "General";
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
    contDiv.className = "mb-4";
    contDiv.innerHTML = `
      <button class="w-full flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all acordeon-btn">
        <div class="flex items-center gap-3">
            <span class="text-xl">🌍</span>
             <span class="font-bold text-slate-800 uppercase tracking-tight">
            ${continente}
            <span class="ml-2 text-[15px] font-black text-indigo-500">
               (${conteoContinente[continente]})
             </span>
            </span>

        </div>
        <i class="fas fa-chevron-down text-slate-300 transition-transform"></i>
      </button>
      <div class="panel hidden mt-2 space-y-3 pl-2 border-l-2 border-indigo-100 ml-4 py-2"></div>
    `;
    const contContent = contDiv.querySelector(".panel");

    Object.keys(grupos[continente]).sort().forEach(pais => {
      const paisDiv = document.createElement("div");
      paisDiv.className = "mb-2";
      paisDiv.innerHTML = `
        <button class="w-full flex items-center gap-2 px-3 py-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 rounded-lg transition-colors acordeon-btn">
        <i class="fas fa-map-marker-alt text-[10px]"></i>
        ${pais.toUpperCase()}
        <span class="ml-2 text-[14px] font-black text-emerald-600">
        (${conteoPais[`${continente}|${pais}`] || 0})
        </span>


        </button>
        <div class="panel hidden mt-2 space-y-2 pl-3"></div>
      `;
      const paisContent = paisDiv.querySelector(".panel");

      const dataPais = grupos[continente][pais];
      
      const renderCard = (p) => {
        const statusColors = {
            'Planeación': 'bg-indigo-100 text-indigo-700',
            'Ejecución': 'bg-emerald-100 text-emerald-700',
            'Finalizado': 'bg-slate-100 text-slate-700'
        };
        const colorClass = statusColors[p.status] || 'bg-slate-100 text-slate-700';
        
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden";
        card.innerHTML = `
          <button class="w-full text-left px-4 py-4 acordeon-btn group">
            <div class="flex justify-between items-start gap-3">
                <div class="flex-1">
                    <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 leading-none">${p.Sector || 'Sin Sector'}</div>
                    <div class="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">${escapeHtml(p.Nombredelproyecto)}</div>
                </div>
                <span class="px-2 py-1 rounded text-[9px] font-black uppercase ${colorClass}">${p.status}</span>
            </div>
          </button>
          <div class="panel hidden px-4 pb-5 border-t border-slate-50 pt-4 bg-slate-50/50">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <div class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Inicio</div>
                    <div class="text-xs font-bold text-slate-700"><i class="far fa-calendar-alt mr-1"></i> ${p.Fechadeinicio || '---'}</div>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-100 text-center">
                    <div class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Término</div>
                    <div class="text-xs font-bold text-slate-700"><i class="fas fa-hourglass-end mr-1"></i> ${p.Fechadetermino || '---'}</div>
                </div>
            </div>
            <div class="space-y-3">
                <div>
                    <h4 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Objetivo Estratégico</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(p.Objetivo || "Sin objetivo definido.")}</p>
                </div>
                ${p.notas ? `
                <div class="bg-amber-50/50 p-3 rounded-xl border border-amber-100 italic">
                    <h4 class="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Observaciones</h4>
                    <p class="text-xs text-amber-800">${escapeHtml(p.notas)}</p>
                </div>` : ''}
            </div>
            <div class="mt-5 flex gap-2">
              <button data-id="${p.id}" class="btn-edit flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all">Editar</button>
              <button data-id="${p.id}" class="btn-delete flex-1 py-2 bg-white border border-red-100 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all">Eliminar</button>
            </div>
          </div>
        `;
        return card;
      };

      if (PAISES_CON_SUBTIPO.includes(pais) && !Array.isArray(dataPais)) {
        Object.keys(dataPais).sort().forEach(sub => {
          const subDiv = document.createElement("div");
          subDiv.className = "mb-2 ml-2";
          subDiv.innerHTML = `
            <button class="w-full text-left font-bold text-[11px] text-emerald-600 mb-2 px-2 flex items-center gap-1">
                <i class="fas fa-tag text-[8px]"></i> ${sub.toUpperCase()}
            </button>
            <div class="space-y-2"></div>
          `;
          const subContent = subDiv.querySelector("div");
          dataPais[sub].forEach(p => subContent.appendChild(renderCard(p)));
          paisContent.appendChild(subDiv);
        });
      } else {
        dataPais.forEach(p => paisContent.appendChild(renderCard(p)));
      }
      contContent.appendChild(paisDiv);
    });
    projectList.appendChild(contDiv);
  });

  attachAccordionEvents();
  attachEditDeleteEvents();
}

/* ============================================================
   🔵 5. NORMATECA & REPORTES
   ============================================================*/
function renderNormateca() {
  const contenedor = document.getElementById("normatecaList");
  contenedor.innerHTML = "";
  if (!normatecaDocs.length) {
    contenedor.innerHTML = `<div class="p-8 text-center text-slate-400 italic text-sm">No hay documentos cargados.</div>`;
    return;
  }
  normatecaDocs.forEach(doc => {
    const card = document.createElement("div");
    card.className = "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4";
    card.innerHTML = `
      <div class="flex-1">
        <div class="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">${escapeHtml(doc.tipo)}</div>
        <h3 class="font-bold text-slate-800 text-sm mb-1">${escapeHtml(doc.titulo)}</h3>
        <p class="text-xs text-slate-500 mb-3 leading-relaxed">${escapeHtml(doc.descripcion || "Sin descripción")}</p>
        <div class="flex gap-4">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter"><i class="far fa-clock"></i> ${doc.anio}</span>
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(doc.pais)}</span>
        </div>
      </div>
      <a href="${doc.archivo}" target="_blank" class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-600 hover:text-white transition-colors">
        <i class="fas fa-download"></i>
      </a>
    `;
    contenedor.appendChild(card);
  });
}

/* ============================================================
   🔵 6. EVENTOS (UI & LOGIC)
   ============================================================*/
function attachAccordionEvents() {
  document.querySelectorAll(".acordeon-btn").forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const panel = btn.nextElementSibling;
        const icon = btn.querySelector(".fa-chevron-down");
        panel.classList.toggle("hidden");
        if(icon) icon.classList.toggle("rotate-180");
    };
  });
}

function attachEditDeleteEvents() {
  document.querySelectorAll(".btn-edit").forEach(b => b.onclick = e => openEditModal(e.target.dataset.id));
  document.querySelectorAll(".btn-delete").forEach(b => b.onclick = e => {
    if (confirm("¿Eliminar este proyecto?")) {
      proyectos = proyectos.filter(p => p.id !== e.target.dataset.id);
      saveToStorage();
      renderList();
    }
  });
}

function attachEvents() {
  searchInput.addEventListener("input", renderList);
  filterResponsible.addEventListener("change", renderList);
  filterStatus.addEventListener("change", renderList);
  btnAddProject.addEventListener("click", openModalForNew);
  btnCancel.addEventListener("click", closeModal);
  projectForm.addEventListener("submit", saveProject);
  btnExportWordPais.addEventListener("click", abrirBottomSheetPais);
  btnExportXLS.addEventListener("click", exportXLS);
  btnImportJSON.addEventListener("click", importJSON);

  // Tabs Logic
  const tabs = {
    'tabProyectos': { section: 'projectList', filters: 'filterSection' },
    'tabnormateca': { section: 'normatecaSection', filters: null },
    'tabgestion': { section: 'gestionSection', filters: null }, // 👈 AQUÍ VA LA GESTIÓN DE CAPACITACIONES Y PERMISOS DE INVESTIGACIÓN
    'tabReportes': { section: 'reportsSection', filters: null }
  };

  Object.keys(tabs).forEach(tabId => {
    document.getElementById(tabId).addEventListener("click", () => {
        // Reset tabs
        Object.keys(tabs).forEach(id => {
            document.getElementById(id).classList.remove("active-tab", "text-indigo-600");
            document.getElementById(id).classList.add("text-slate-400");
            document.getElementById(tabs[id].section).classList.add("hidden");
        });
        
        // Active clicked tab
        const current = tabs[tabId];
        document.getElementById(tabId).classList.add("active-tab", "text-indigo-600");
        document.getElementById(tabId).classList.remove("text-slate-400");
        document.getElementById(current.section).classList.remove("hidden");
        
        // Toggle filters visibility
        const filters = document.getElementById("filterSection");
        if (current.filters) filters.classList.remove("hidden");
        else filters.classList.add("hidden");

        if(tabId === 'tabnormateca') renderNormateca();

        if (tabId === 'tabgestion') {
        mostrarCapacitaciones();
        renderInvestigacion();   

        }

    });
  });

  // ===== GESTIÓN: SUB-TABS =====
  if (tabCapacitaciones && tabInvestigacion) {
    tabCapacitaciones.addEventListener("click", mostrarCapacitaciones);
    tabInvestigacion.addEventListener("click", mostrarInvestigacion);
  }



// ===== REPORTES · WORD POR PAÍS =====
if (searchPais && btnCancelarPais && btnAceptarPais && bottomSheetPais && listaPaises) {

  searchPais.addEventListener("input", renderListaPaises);

  btnCancelarPais.addEventListener("click", cerrarBottomSheetPais);

  btnAceptarPais.addEventListener("click", () => {
    if (!paisSeleccionado) {
      alert("Selecciona un país para exportar");
      return;
    }

    cerrarBottomSheetPais();
    exportarWordPorPais(paisSeleccionado);
  });
}


}





/* ============================================================
   🔵 7. MODAL LOGIC
   ============================================================*/
function openModalForNew() {
  modalTitle.textContent = "NUEVO PROYECTO";
  projectForm.reset();
  projId.value = "";
  showModal();
}

function openEditModal(id) {
  const p = proyectos.find(x => x.id === id);
  if (!p) return;
  modalTitle.textContent = "EDITAR PROYECTO";
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

function showModal() { modal.classList.remove("hidden"); modal.style.display = "flex"; }
function closeModal() { modal.classList.add("hidden"); modal.style.display = "none"; }

function saveProject(ev) {
  ev.preventDefault();
  const id = projId.value;
  const data = {
    id: id || cryptoRandomId(),
    Nombredelproyecto: projNombredelproyecto.value.trim(),
    Sector: projSector.value.trim(),
    Pais: projPais.value.trim(),
    Continente: projContinente.value.trim().toUpperCase(),
    Fechadeinicio: projFechadeinicio.value.trim(),
    Fechadetermino: projFechadetermino.value.trim(),
    status: projStatus.value.trim(),
    Objetivo: projObjetivo.value.trim(),
    notas: projNotas.value.trim(),
    createdAt: id ? proyectos.find(p => p.id === id).createdAt : new Date().toISOString()
  };
  if (id) proyectos = proyectos.map(p => p.id === id ? data : p);
  else proyectos.unshift(data);
  saveToStorage();
  closeModal();
  renderList();
}

/* ============================================================
   🔵 8. EXPORTACIONES (Mantienen tu lógica original)
   ============================================================*/
function iniciarExportacionPorPais() {
  abrirBottomSheetPais();
}

async function exportarWordPorPais(paisSeleccionado) {
  const proyectosPais = proyectos.filter(p => p.Pais === paisSeleccionado);

  if (!proyectosPais.length) {
      alert("No hay proyectos para este país");
      return;
  }

  try {
      // 1️⃣ Cargar la plantilla con URL absoluta si es necesario
      const response = await fetch("https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/PlantillaReportes_v2.docx"); 
      if (!response.ok) throw new Error("No se encontró el archivo PlantillaReportes.docx");
      
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      const doc = new window.docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
      });

      // 2️⃣ Mapeo de datos (Asegúrate de que coincidan con las {{etiquetas}} de Word)
      const data = {
          proyectos: proyectosPais.map(p => ({
              Nombredelproyecto: p.Nombredelproyecto || "S/N",
              Sector: p.Sector || "S/S",
              Pais: p.Pais || "",
              status: p.status || "",
              Fechadeinicio: p.Fechadeinicio || "",
              Fechadetermino: p.Fechadetermino || "",
              Objetivo: p.Objetivo || "",
              notas: p.notas || ""
          }))
      };

      doc.render(data);

      // 3️⃣ Generar y descargar
      const out = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `Reporte_Proyectos_${paisSeleccionado}.docx`);

  } catch (error) {
      // Esto te dirá exactamente qué etiqueta está mal en el Word
      if (error.properties && error.properties.errors) {
          const errorMessages = error.properties.errors.map(e => e.properties.explanation).join("\n");
          console.error("Errores de la plantilla:", errorMessages);
          alert("Error en la plantilla Word:\n" + errorMessages);
      } else {
          console.error(error);
          alert("Error de conexión o de archivo. Revisa la consola.");
      }
  }
}



function exportXLS() {
  const worksheet = XLSX.utils.json_to_sheet(proyectos);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Proyectos");
  XLSX.writeFile(workbook, "Proyectos_DG.xlsx");
}

function importJSON() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";
  fileInput.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = JSON.parse(ev.target.result);
      if (Array.isArray(parsed)) {
        proyectos = parsed;
        saveToStorage();
        renderList();
        alert("¡Datos importados con éxito!");
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

function populateResponsibles() {
  const allSectors = [];
  proyectos.forEach(p => {
     if (p.Sector) {
      const sectores = p.Sector.split(',').map(s => s.trim()).filter(s => s.length > 0);
      allSectors.push(...sectores);
    }
  });
  const uniqueSectores = Array.from(new Set(allSectors)).sort();
  filterResponsible.innerHTML = `<option value="">Sector</option>`;
  uniqueSectores.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s; opt.textContent = s;
    filterResponsible.appendChild(opt);
  });
}

/* ============================================================
   🔵 9. GESTIÓN - CAPACITACIONES & PERMISOS DE INVESTIGAIÓN
   ============================================================*/

function mostrarCapacitaciones() {
  gestionCapacitaciones.classList.remove("hidden");
  gestionInvestigacion.classList.add("hidden");

  tabCapacitaciones.classList.add("bg-white", "text-indigo-600", "shadow-sm");
  tabCapacitaciones.classList.remove("text-slate-400");

  tabInvestigacion.classList.remove("bg-white", "text-indigo-600", "shadow-sm");
  tabInvestigacion.classList.add("text-slate-400");

  renderCapacitaciones();

}


function mostrarInvestigacion() {
  gestionInvestigacion.classList.remove("hidden");
  gestionCapacitaciones.classList.add("hidden");

  tabInvestigacion.classList.add("bg-white", "text-indigo-600", "shadow-sm");
  tabInvestigacion.classList.remove("text-slate-400");

  tabCapacitaciones.classList.remove("bg-white", "text-indigo-600", "shadow-sm");
  tabCapacitaciones.classList.add("text-slate-400");

}

/* ============================================================
   🔵 9.1 GESTIÓN - CAPACITACIONES
   ============================================================*/

   function renderCapacitaciones() {
  gestionCapacitaciones.innerHTML = "";

  // 1️⃣ Agrupar proyectos por país
  const porPais = {};
  capacitaciones.forEach(cap => {
    if (!porPais[cap.pais]) porPais[cap.pais] = [];
    porPais[cap.pais].push(cap);
  });

  // 2️⃣ Crear acordeón por país
   Object.keys(porPais).forEach(pais => {
  const contenedorPais = document.createElement("div");
  contenedorPais.className = "bg-white rounded-3xl p-4 shadow-sm border border-slate-100";

  contenedorPais.innerHTML = `
    <button class="w-full flex items-center justify-between acordeon-btn">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">📍</div>
        <div>
          <div class="font-bold uppercase">${pais}</div>
          <div class="text-[10px] text-slate-400 font-bold">
            ${porPais[pais].length} cursos activos
          </div>
        </div>
      </div>
      <i class="fas fa-chevron-down transition-transform"></i>
    </button>

    <div class="panel hidden mt-4 space-y-3"></div>
  `;


  // 3️⃣ Cards de proyectos
const panelPais = contenedorPais.querySelector(".panel");

porPais[pais].forEach(cap => {
  const card = document.createElement("div");
  card.className = "rounded-2xl overflow-hidden";

  card.innerHTML = `
    <button class="w-full bg-indigo-600 text-white px-4 py-4 flex justify-between items-center acordeon-btn">
      <div class="font-bold text-sm">${cap.titulo}</div>
      <span class="text-[9px] bg-white/20 px-2 py-1 rounded-full uppercase">${cap.modalidad}</span>
    </button>

    <div class="panel hidden bg-white p-4 space-y-4">
      
      <div class="text-xs">
        <i class="fas fa-graduation-cap text-indigo-600 mr-1"></i>
        <b>Título original</b><br>${cap.tituloOriginal}
      </div>

      <div class="text-xs">
        <i class="fas fa-university text-indigo-600 mr-1"></i>
        <b>Instituto</b><br>${cap.instituto}
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-50 p-2 rounded-lg text-center">
          <div class="text-[9px] font-bold uppercase">Inicio</div>
          ${cap.fechaInicio}
        </div>
        <div class="bg-slate-50 p-2 rounded-lg text-center">
          <div class="text-[9px] font-bold uppercase">Término</div>
          ${cap.fechaFin}
        </div>
      </div>

      <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-xs">
        <b>Código DTE:</b> ${cap.dte}<br>
        <b>Límite candidaturas:</b> ${cap.limiteCandidaturas}
      </div>

      ${cap.notas ? `
      <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs italic">
        <b>Notas del curso</b><br>${cap.notas}
      </div>` : ""}

    </div>
  `;

  panelPais.appendChild(card);
});

gestionCapacitaciones.appendChild(contenedorPais);
});
attachAccordionEvents();
}


/* ============================================================
   🔵 9.2 GESTIÓN - PERMISOS DE INVESTIGAIÓN
   ============================================================*/

   function renderInvestigacion() {
  gestionInvestigacion.innerHTML = "";

  // 1️⃣ Agrupar proyectos por país
  const porPais = {};
  investigaciones.forEach(inv => {
    if (!porPais[inv.pais]) porPais[inv.pais] = [];
    porPais[inv.pais].push(inv);
  });

  // 2️⃣ Crear acordeón por país
  Object.keys(porPais).forEach(pais => {
    const contenedorPais = document.createElement("div");
    contenedorPais.className = "bg-white rounded-3xl p-4 shadow-sm border border-slate-100";

    contenedorPais.innerHTML = `
      <button class="w-full flex items-center justify-between acordeon-btn">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            📍
          </div>
          <div class="text-left">
            <div class="font-bold text-slate-800 uppercase">${pais}</div>
            <div class="text-[10px] text-slate-400 font-bold uppercase">
              ${porPais[pais].length} proyecto(s)
            </div>
          </div>
        </div>
        <i class="fas fa-chevron-down text-slate-300 transition-transform"></i>
      </button>

      <div class="panel hidden mt-4 space-y-3"></div>
    `;

    const panelPais = contenedorPais.querySelector(".panel");

    // 3️⃣ Cards de proyectos
    porPais[pais].forEach(inv => {
      const card = document.createElement("div");
      card.className = "bg-indigo-600 rounded-2xl overflow-hidden text-white";

      card.innerHTML = `
        <button class="w-full text-left px-4 py-4 acordeon-btn">
          <div class="font-bold text-sm">${inv.nombre}</div>
        </button>

        <div class="panel hidden bg-white text-slate-700 px-4 py-4 space-y-3">
          <div class="text-xs">
            <i class="far fa-calendar-alt mr-1 text-indigo-600"></i>
            <b>Fecha de ejecución</b><br>
            ${inv.fechaInicio} – ${inv.fechaFin}
          </div>

          <div class="text-xs">
            <i class="fas fa-university mr-1 text-indigo-600"></i>
            <b>Instituciones</b>
            <ul class="list-disc pl-4 mt-1">
              ${inv.instituciones.map(i => `<li>${i}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;

      panelPais.appendChild(card);
    });

    gestionInvestigacion.appendChild(contenedorPais);
  });

  attachAccordionEvents();
}





