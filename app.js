// app.js - Versión UI Mejorada (DG Cooperación) v10.0 abril 2026

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

const capContainer = document.getElementById("capacitacionesList");



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

    return data || {};

  } catch (err) {
    console.warn("Error cargando Capacitaciones:", err);
    return {};
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

/* ============================================================
   🔵 4. RENDER LISTA (DISEÑO MEJORADO) // REDISEÑADO
   ============================================================*/
function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const sectorFilter = filterResponsible.value;
  const statusFilter = filterStatus.value;

  let filtered = proyectos.filter(p => {
    const matchQ = !q || (p.Nombredelproyecto + " " + p.status + " " + p.Pais + " " + p.Continente).toLowerCase().includes(q);
    const matchSector = !sectorFilter || (p.Sector && p.Sector.toUpperCase().includes(sectorFilter.toUpperCase()));
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchQ && matchStatus && matchSector;
  });

  const counterEl = document.getElementById("projectCounter");
  if (counterEl) counterEl.innerHTML = `${filtered.length} Proyectos Activos`;

  if (filtered.length === 0) {
    projectList.innerHTML = `<div class="p-8 text-center bg-surface-container-low rounded-2xl text-outline">No se encontraron proyectos</div>`;
    return;
  }

  // Agrupar por continente
  const grupos = {};
  const conteoContinente = {};
  const conteoPais = {};

  filtered.forEach(p => {
    const c = (p.Continente || "Sin Continente").trim();
    const pais = (p.Pais || "Sin País").trim();
    conteoContinente[c] = (conteoContinente[c] || 0) + 1;
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

  // Iconos por continente
  const continenteIconos = {
    "AMÉRICA": "public",
    "AMERICA": "public",
    "EUROPA": "travel_explore",
    "ÁFRICA": "map",
    "AFRICA": "map",
    "ASIA": "map",
    "OCEANÍA": "map"
  };

  Object.keys(grupos).sort().forEach(continente => {
    const contDiv = document.createElement("div");
    contDiv.className = "rounded-2xl overflow-hidden bg-surface-container-low transition-all duration-300";
    
    const icono = continenteIconos[continente.toUpperCase()] || "public";
    const count = conteoContinente[continente] || 0;
    
    contDiv.innerHTML = `
      <div class="p-5 flex items-center justify-between cursor-pointer border-l-4 border-secondary bg-surface-container-low cont-btn">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 flex items-center justify-center bg-secondary-fixed rounded-xl text-secondary">
            <span class="material-symbols-outlined">${icono}</span>
          </div>
          <div>
            <h2 class="font-headline font-bold text-lg text-primary tracking-tight">${continente}</h2>
            <p class="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">${count} Proyectos Activos</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-outline-variant transition-transform cont-icon">expand_more</span>
      </div>
      <div class="cont-panel hidden bg-surface-container p-2 space-y-2"></div>
    `;
    
    const panel = contDiv.querySelector(".cont-panel");
    const btn = contDiv.querySelector(".cont-btn");
    const icon = contDiv.querySelector(".cont-icon");
    
    btn.addEventListener("click", () => {
      panel.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    // Agregar países
    Object.keys(grupos[continente]).sort().forEach(pais => {
      const dataPais = grupos[continente][pais];
      const countPais = conteoPais[`${continente}|${pais}`] || 0;
      
      const paisDiv = document.createElement("div");
      
      // Determinar si tiene subtipos
      const tieneSubtipos = PAISES_CON_SUBTIPO.includes(pais) && !Array.isArray(dataPais);
      
      if (!tieneSubtipos && Array.isArray(dataPais) && dataPais.length > 0) {
        // País sin subtipos - acordeón directo
        paisDiv.className = "bg-surface-container-lowest rounded-xl overflow-hidden diplomatic-shadow mb-2";
        paisDiv.innerHTML = `
          <div class="p-4 flex items-center justify-between cursor-pointer pais-btn">
            <div class="flex items-center gap-3">
              <div class="w-8 h-6 overflow-hidden rounded shadow-sm">
                <img class="w-full h-full object-cover flag-img" data-pais="${pais}" src="" alt="Bandera de ${pais}">
              </div>
              <span class="font-semibold text-primary">${pais}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-black tracking-tighter">${countPais} PROY</span>
              <span class="material-symbols-outlined text-outline-variant pais-icon transition-transform">expand_more</span>
            </div>
          </div>
          <div class="pais-panel hidden bg-surface-container-low p-3 space-y-3"></div>
        `;
        
        const paisPanel = paisDiv.querySelector(".pais-panel");
        const paisBtn = paisDiv.querySelector(".pais-btn");
        const paisIcon = paisDiv.querySelector(".pais-icon");
        
        paisBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          paisPanel.classList.toggle("hidden");
          paisIcon.classList.toggle("rotate-180");
        });
        
        // Agregar proyectos directamente
        dataPais.forEach(p => {
          paisPanel.appendChild(renderProjectCard(p));
        });
      } else if (tieneSubtipos) {
        // País con subtipos
        paisDiv.className = "bg-surface-container-lowest rounded-xl overflow-hidden diplomatic-shadow mb-2";
        paisDiv.innerHTML = `
          <div class="p-4 flex items-center justify-between cursor-pointer pais-btn">
            <div class="flex items-center gap-3">
              <div class="w-8 h-6 overflow-hidden rounded shadow-sm">
                <img class="w-full h-full object-cover flag-img" data-pais="${pais}" src="" alt="Bandera de ${pais}">
              </div>
              <span class="font-semibold text-primary">${pais}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-black tracking-tighter">${countPais} PROY</span>
              <span class="material-symbols-outlined text-outline-variant pais-icon transition-transform">expand_more</span>
            </div>
          </div>
          <div class="pais-panel hidden bg-surface-container-low p-3 space-y-3"></div>
        `;
        
        const paisPanel = paisDiv.querySelector(".pais-panel");
        const paisBtn = paisDiv.querySelector(".pais-btn");
        const paisIcon = paisDiv.querySelector(".pais-icon");
        
        paisBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          paisPanel.classList.toggle("hidden");
          paisIcon.classList.toggle("rotate-180");
        });
        
        // Agregar subtipos
        Object.keys(dataPais).sort().forEach(subtipo => {
          const subDiv = document.createElement("div");
          subDiv.className = "space-y-2";
          subDiv.innerHTML = `
            <div class="flex items-center gap-2 px-2 pb-1">
              <span class="material-symbols-outlined text-secondary scale-75">account_balance</span>
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-outline">${subtipo}</span>
            </div>
            <div class="space-y-2"></div>
          `;
          const subContent = subDiv.querySelector("div:last-child");
          dataPais[subtipo].forEach(p => {
            subContent.appendChild(renderProjectCard(p));
          });
          paisPanel.appendChild(subDiv);
        });
      }
      
      panel.appendChild(paisDiv);
    });
    
    projectList.appendChild(contDiv);
  });
  
  // Cargar banderas después de renderizar
  loadFlags();
  attachEditDeleteEvents();
}




/* ============================================================
   🔵 4.1 RENDER LISTA (DISEÑO MEJORADO) // REDISEÑADO:
    
    loadFlags() (para cargar las banderas de los países)

    getCountryCode() (para obtener el código de cada país)

    renderProjectCard() (para generar cada tarjeta de proyecto con el nuevo diseño)
   ============================================================*/


// Función para cargar banderas usando FlagCDN
function loadFlags() {
  document.querySelectorAll('.flag-img').forEach(img => {
    const pais = img.getAttribute('data-pais');
    if (pais) {
      const paisCodigo = getCountryCode(pais);
      img.src = `https://flagcdn.com/w40/${paisCodigo}.png`;
      img.onerror = () => { img.src = ''; img.outerHTML = `<span class="text-sm">🏳️</span>`; };
    }
  });
}

// Helper para códigos de país (versión ampliada)
function getCountryCode(pais) {
  const codes = {
    // Latinoamérica
    'Argentina': 'ar', 'Bolivia': 'bo', 'Brasil': 'br', 'Chile': 'cl', 'Colombia': 'co',
    'Costa Rica': 'cr', 'Cuba': 'cu', 'Ecuador': 'ec', 'El Salvador': 'sv', 'Guatemala': 'gt',
    'Haití': 'ht', 'Honduras': 'hn', 'México': 'mx', 'Nicaragua': 'ni', 'Panamá': 'pa',
    'Paraguay': 'py', 'Perú': 'pe', 'República Dominicana': 'do', 'Uruguay': 'uy', 'Venezuela': 've',
    // Europa
    'Alemania': 'de', 'Austria': 'at', 'Bélgica': 'be', 'Dinamarca': 'dk', 'España': 'es',
    'Finlandia': 'fi', 'Francia': 'fr', 'Grecia': 'gr', 'Hungría': 'hu', 'Irlanda': 'ie',
    'Italia': 'it', 'Noruega': 'no', 'Países Bajos': 'nl', 'Polonia': 'pl', 'Portugal': 'pt',
    'Reino Unido': 'gb', 'República Checa': 'cz', 'Rumania': 'ro', 'Rusia': 'ru', 'Suecia': 'se',
    'Suiza': 'ch', 'Ucrania': 'ua',
    // Asia
    'China': 'cn', 'Corea del Sur': 'kr', 'Filipinas': 'ph', 'India': 'in', 'Indonesia': 'id',
    'Japón': 'jp', 'Malasia': 'my', 'Tailandia': 'th', 'Vietnam': 'vn',
    // África
    'Angola': 'ao', 'Argelia': 'dz', 'Egipto': 'eg', 'Kenia': 'ke', 'Marruecos': 'ma',
    'Nigeria': 'ng', 'Sudáfrica': 'za',
    // Norteamérica
    'Canadá': 'ca', 'Estados Unidos': 'us',
    // Oceanía
    'Australia': 'au', 'Nueva Zelanda': 'nz'
  };
  return codes[pais] || 'un';
}

// Función para renderizar cada tarjeta de proyecto (NUEVO DISEÑO)
function renderProjectCard(p) {
  const statusColors = {
    'Planeación': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    'Ejecución': 'bg-secondary-fixed text-on-secondary-fixed-variant',
    'Finalizado': 'bg-surface-container-high text-outline'
  };
  const colorClass = statusColors[p.status] || 'bg-surface-container-high text-outline';
  
  const card = document.createElement("div");
  card.className = "bg-surface-container-lowest rounded-xl border border-secondary/10 overflow-hidden";
  card.innerHTML = `
    <div class="p-4 flex items-center justify-between cursor-pointer project-btn hover:bg-surface-container/50 transition-colors">
      <h3 class="font-headline font-bold text-sm text-primary">${escapeHtml(p.Nombredelproyecto)}</h3>
      <span class="material-symbols-outlined text-outline-variant project-icon transition-transform">expand_more</span>
    </div>
    <div class="project-panel hidden p-5 space-y-6 border-t border-surface-container">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-surface-container-low p-3 rounded-lg flex items-center gap-3">
          <span class="material-symbols-outlined text-secondary text-sm">calendar_today</span>
          <div>
            <p class="text-[9px] uppercase tracking-widest text-outline font-bold">Inicio</p>
            <p class="text-xs font-semibold text-primary">${p.Fechadeinicio || '---'}</p>
          </div>
        </div>
        <div class="bg-surface-container-low p-3 rounded-lg flex items-center gap-3">
          <span class="material-symbols-outlined text-secondary text-sm">event_available</span>
          <div>
            <p class="text-[9px] uppercase tracking-widest text-outline font-bold">Término</p>
            <p class="text-xs font-semibold text-primary">${p.Fechadetermino || '---'}</p>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4">
        <div class="w-1 bg-secondary rounded-full"></div>
        <div class="flex-1">
          <h4 class="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Objetivo Estratégico</h4>
          <p class="text-sm text-on-surface-variant leading-relaxed">${escapeHtml(p.Objetivo || 'Sin objetivo definido.')}</p>
        </div>
      </div>
      
      ${p.Estados && p.Estados.length ? `
      <div>
        <h4 class="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Estados Afiliados</h4>
        <div class="flex flex-wrap gap-2">
          ${p.Estados.map(e => `<span class="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-medium rounded-full">${escapeHtml(e)}</span>`).join("")}
        </div>
      </div>
      ` : ""}
      
      ${p.notas ? `
      <div class="bg-surface-container-high/50 p-4 rounded-xl border-l-4 border-outline-variant">
        <div class="flex items-center gap-2 mb-1">
          <span class="material-symbols-outlined text-outline text-xs">sticky_note_2</span>
          <span class="text-[9px] font-black uppercase tracking-widest text-outline">Observaciones Técnicas</span>
        </div>
        <p class="text-[11px] italic text-on-surface-variant">${escapeHtml(p.notas)}</p>
      </div>
      ` : ""}
      
      <div class="flex items-center justify-between pt-2 border-t border-surface-container">
        <span class="px-3 py-1 ${colorClass} text-[10px] font-black rounded-full uppercase tracking-widest">${p.status}</span>
        <div class="flex gap-2">
          <button data-id="${p.id}" class="btn-edit text-secondary text-xs font-bold flex items-center gap-1">
            Editar
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button data-id="${p.id}" class="btn-delete text-outline text-xs font-bold flex items-center gap-1">
            Eliminar
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  const projectBtn = card.querySelector(".project-btn");
  const projectPanel = card.querySelector(".project-panel");
  const projectIcon = card.querySelector(".project-icon");
  
  projectBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    projectPanel.classList.toggle("hidden");
    projectIcon.classList.toggle("rotate-180");
  });
  
  return card;
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
  btnExportPDF.addEventListener("click", exportPDF);
  btnExportXLS.addEventListener("click", exportXLS);
  btnImportJSON.addEventListener("click", importJSON);

  // Tabs Logic
  const tabs = {
    'tabProyectos': { section: 'projectList', filters: 'filterSection' },
    'tabnormateca': { section: 'normatecaSection', filters: null },
    'tabgestion': { section: 'gestionSection', filters: null }, // 👈 AQUÍ
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
        renderCapacitaciones()
        renderInvestigacion();   
        }

    });
  });


    // ===== NUEVOS SUBTABS: PROYECTOS / ACCIONES =====
  const subtabProyectos = document.getElementById("subtabProyectos");
  const subtabAcciones = document.getElementById("subtabAcciones");
  const projectListSection = document.getElementById("projectList");
  const accionesSection = document.getElementById("accionesSection");

  if (subtabProyectos && subtabAcciones) {
    // Estado inicial: Proyectos visible, Acciones oculto
    if (accionesSection) accionesSection.classList.add("hidden");
    
    subtabProyectos.addEventListener("click", () => {
      // Estilos del tab activo
      subtabProyectos.classList.add("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow");
      subtabProyectos.classList.remove("text-on-surface-variant");
      subtabAcciones.classList.remove("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow");
      subtabAcciones.classList.add("text-on-surface-variant");
      
      // Mostrar/ocultar secciones
      if (projectListSection) projectListSection.classList.remove("hidden");
      if (accionesSection) accionesSection.classList.add("hidden");
      
      // Refrescar lista por si acaso
      renderList();
    });
    
    subtabAcciones.addEventListener("click", () => {
      // Estilos del tab activo
      subtabAcciones.classList.add("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow");
      subtabAcciones.classList.remove("text-on-surface-variant");
      subtabProyectos.classList.remove("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow");
      subtabProyectos.classList.add("text-on-surface-variant");
      
      // Mostrar/ocultar secciones
      if (projectListSection) projectListSection.classList.add("hidden");
      if (accionesSection) accionesSection.classList.remove("hidden");
    });
  }

  
    // ===== GESTIÓN: SUB-TABS =====
    if (tabCapacitaciones && tabInvestigacion) {

      tabCapacitaciones.addEventListener("click", () => {

        // activar estilos
        tabCapacitaciones.classList.add("bg-white","text-indigo-600");
        tabCapacitaciones.classList.remove("text-slate-400");

        tabInvestigacion.classList.remove("bg-white","text-indigo-600");
        tabInvestigacion.classList.add("text-slate-400");

        // contenido
        document.getElementById("gestionCapacitaciones").classList.remove("hidden");
        document.getElementById("gestionInvestigacion").classList.add("hidden");

        renderCapacitaciones();

      });

      tabInvestigacion.addEventListener("click", () => {

        // activar estilos
        tabInvestigacion.classList.add("bg-white","text-indigo-600");
        tabInvestigacion.classList.remove("text-slate-400");

        tabCapacitaciones.classList.remove("bg-white","text-indigo-600");
        tabCapacitaciones.classList.add("text-slate-400");

        // contenido
        document.getElementById("gestionCapacitaciones").classList.add("hidden");
        document.getElementById("gestionInvestigacion").classList.remove("hidden");

        renderInvestigacion();

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
function exportPDF() {
  let html = `<div style="font-family: Arial; padding: 20px;">
    <h1 style="text-align:center; color:#1e1b4b;">Listado de Proyectos — DG Cooperación</h1><hr>`;
  proyectos.forEach(p => {
    html += `<div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;">
      <h2 style="color:#4f46e5; margin-bottom:5px;">${escapeHtml(p.Nombredelproyecto)}</h2>
      <p style="font-size:12px;"><b>Ubicación:</b> ${p.Continente} / ${p.Pais} | <b>Estatus:</b> ${p.status}</p>
      <p style="font-size:12px;"><b>Objetivo:</b> ${escapeHtml(p.Objetivo)}</p>
    </div>`;
  });
  html += `</div>`;
  printArea.innerHTML = html;
  const opt = { margin: 0.5, filename: "Reporte_Proyectos_DG.pdf", html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: "letter" } };
  html2pdf().set(opt).from(printArea).save();
}



function exportXLS() {

  const data = proyectos.map(p => ({
    ...p,
    Estados: (p.Estados || []).join(", ")
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Proyectos");

  XLSX.writeFile(workbook, "Proyectos_DG.xlsx");
}

/* FUNCIÓN ANTERIOR PARA EXPORTAR EN EXCEL

function exportXLS() {
  const worksheet = XLSX.utils.json_to_sheet(proyectos);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Proyectos");
  XLSX.writeFile(workbook, "Proyectos_DG.xlsx");
}
*/



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

function renderCapacitaciones() {

  const data = capacitaciones; // ← usamos el JSON para especificar las capacitaciones de cada país

  const contenedor = document.getElementById("capacitacionesList");
  contenedor.innerHTML = "";

  Object.entries(data).forEach(([pais, info]) => {

    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow-sm p-4 mb-4";

    card.innerHTML = `
      <div class="flex justify-between items-center cursor-pointer pais-header">
        <div>
          <div class="font-semibold text-slate-700">${pais}</div>

          <div class="text-sm text-slate-500">
            Total de recepción de capacitaciones:
            <span class="text-purple-600 font-semibold">${info.totalRecepcion}</span>
          </div>

          <div class="text-sm text-slate-500">
            Total de capacitaciones difundidas:
            <span class="text-purple-600 font-semibold">${info.totalDifusion}</span>
          </div>
        </div>

        <div class="material-symbols-outlined text-slate-400 transition-transform">expand_more</div>
      </div>

      <div class="capacitaciones hidden mt-3 bg-slate-50 rounded-xl p-3">
        ${
          info.capacitaciones.map(cap => `

          <div class="flex items-center justify-between py-2 text-sm cursor-pointer text-slate-600 hover:text-purple-600"
              onclick="abrirCapacitacion('${cap.id}')">

            <span class="truncate">
              ${cap.titulo}
            </span>

            <span class="material-symbols-outlined text-slate-400 text-base">
              chevron_right
            </span>

          </div>

            
          `).join("")
        }
      </div>
    `;

    contenedor.appendChild(card);
  });

  activarAcordeon();
}

// ===== Activar el acordeón =====

function activarAcordeon() {

  const headers = document.querySelectorAll(".pais-header");

  headers.forEach(header => {

    header.addEventListener("click", () => {

      const contenido = header.parentElement.querySelector(".capacitaciones");

      contenido.classList.toggle("hidden");

    });

  });

}

// ===== Abrir la página de la capacitación =====

function abrirCapacitacion(id){

  window.location.href = `capacitacion.html?id=${id}`;

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
