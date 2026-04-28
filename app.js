// app.js - Versión CORREGIDA y SIMPLIFICADA (DG Cooperación)

const LS_KEY = "dg_proyectos_v2";

// DOM Elements
const projectList = document.getElementById("projectList");
const searchInput = document.getElementById("searchInput");
const filterResponsible = document.getElementById("filterResponsible");
const filterStatus = document.getElementById("filterStatus");
const filterState = document.getElementById("filterState");
const btnMenu = document.getElementById("btnMenu");
const menuPanel = document.getElementById("menuPanel");

const btnExportPDF = document.getElementById("btnExportPDF");
const btnExportXLS = document.getElementById("btnExportXLS");
const btnImportJSON = document.getElementById("btnImportJSON");
const printArea = document.getElementById("printArea");

// Form fields (se mantienen, aunque el modal ya no se use activamente)
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

// Constantes
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
async function loadFromJsonUrl(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        return Array.isArray(data) ? data : (data || {});
    } catch (err) {
        console.warn(`Error cargando ${url}:`, err);
        return [];
    }
}

function loadFromStorage() {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveToStorage() {
    localStorage.setItem(LS_KEY, JSON.stringify(proyectos));
}

/* ============================================================
   🔵 2. INICIALIZACIÓN
   ============================================================*/
async function init() {
    console.log("Iniciando aplicación...");
    const proyectosGithub = await loadFromJsonUrl("https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/proyectos.json");
    
    if (proyectosGithub && proyectosGithub.length > 0) {
        proyectos = proyectosGithub;
        saveToStorage();
        console.log(`${proyectos.length} proyectos cargados desde GitHub.`);
    } else {
        proyectos = loadFromStorage();
        console.log(`${proyectos.length} proyectos cargados desde localStorage.`);
    }

    normatecaDocs = await loadFromJsonUrl("https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/normateca.json");
    investigaciones = await loadFromJsonUrl("https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/investigacion.json");
    capacitaciones = await loadFromJsonUrl("https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/capacitaciones.json");

    // Renderizar todo después de cargar los datos
    renderList();
    updateStats();
    populateResponsibles();
    populateStates();
    attachEvents();
    console.log("Inicialización completada.");
}

init();

/* ============================================================
   🔵 3. HELPERS
   ============================================================*/
function cryptoRandomId() { return Math.random().toString(36).slice(2, 9); }
function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

/* ============================================================
   🔵 4. LÓGICA DE RENDERIZADO (Revertida a la versión que FUNCIONA)
   ============================================================*/
function renderList() {
    if (!projectList) return;
    const q = searchInput.value.trim().toLowerCase();
    const sectorFilter = filterResponsible.value;
    const statusFilter = filterStatus.value;
    const stateFilter = filterState ? filterState.value : "";

    let filtered = proyectos.filter(p => {
        const matchQ = !q || (p.Nombredelproyecto + " " + p.status + " " + p.Pais + " " + p.Continente).toLowerCase().includes(q);
        const matchSector = !sectorFilter || (p.Sector && p.Sector.toUpperCase().includes(sectorFilter.toUpperCase()));
        const matchStatus = !statusFilter || p.status === statusFilter;
        const matchState = !stateFilter || (p.Estados && p.Estados.includes(stateFilter));
        return matchQ && matchStatus && matchSector && matchState;
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

    const continenteIconos = {
        "AMÉRICA": "public", "AMERICA": "public", "EUROPA": "travel_explore",
        "ÁFRICA": "map", "AFRICA": "map", "ASIA": "map", "OCEANÍA": "map"
    };

    Object.keys(grupos).sort().forEach(continente => {
        const contDiv = document.createElement("div");
        contDiv.className = "rounded-2xl overflow-hidden bg-surface-container-low transition-all duration-300 mb-4";
        const icono = continenteIconos[continente.toUpperCase()] || "public";
        const count = conteoContinente[continente] || 0;

        contDiv.innerHTML = `
            <div class="p-5 flex items-center justify-between cursor-pointer border-l-4 border-secondary bg-surface-container-low cont-btn">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 flex items-center justify-center bg-secondary-fixed rounded-xl text-secondary">
                        <span class="material-symbols-outlined">${icono}</span>
                    </div>
                    <div>
                        <h2 class="font-headline font-bold text-lg text-primary tracking-tight">${escapeHtml(continente)}</h2>
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

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            panel.classList.toggle("hidden");
            icon.classList.toggle("rotate-180");
        });

        Object.keys(grupos[continente]).sort().forEach(pais => {
            const dataPais = grupos[continente][pais];
            const countPais = conteoPais[`${continente}|${pais}`] || 0;
            const paisDiv = document.createElement("div");
            const tieneSubtipos = PAISES_CON_SUBTIPO.includes(pais) && !Array.isArray(dataPais);

            if (!tieneSubtipos && Array.isArray(dataPais)) {
                paisDiv.className = "bg-surface-container-lowest rounded-xl overflow-hidden diplomatic-shadow mb-2";
                paisDiv.innerHTML = `
                    <div class="p-4 flex items-center justify-between cursor-pointer pais-btn">
                        <div class="flex items-center gap-3"><div class="w-8 h-6 overflow-hidden rounded shadow-sm"><img class="w-full h-full object-cover flag-img" data-pais="${escapeHtml(pais)}" src="" alt="${escapeHtml(pais)}"></div><span class="font-semibold text-primary">${escapeHtml(pais)}</span></div>
                        <div class="flex items-center gap-3"><span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-black tracking-tighter">${countPais} PROY</span><span class="material-symbols-outlined text-outline-variant pais-icon transition-transform">expand_more</span></div>
                    </div>
                    <div class="pais-panel hidden bg-surface-container-low p-3 space-y-3"></div>`;
                const paisPanel = paisDiv.querySelector(".pais-panel");
                const paisBtn = paisDiv.querySelector(".pais-btn");
                const paisIcon = paisDiv.querySelector(".pais-icon");
                paisBtn.addEventListener("click", (e) => { e.stopPropagation(); paisPanel.classList.toggle("hidden"); paisIcon.classList.toggle("rotate-180"); });
                dataPais.forEach(p => { paisPanel.appendChild(renderProjectCard(p)); });
            }
            else if (tieneSubtipos) {
                paisDiv.className = "bg-surface-container-lowest rounded-xl overflow-hidden diplomatic-shadow mb-2";
                paisDiv.innerHTML = `
                    <div class="p-4 flex items-center justify-between cursor-pointer pais-btn">
                        <div class="flex items-center gap-3"><div class="w-8 h-6 overflow-hidden rounded shadow-sm"><img class="w-full h-full object-cover flag-img" data-pais="${escapeHtml(pais)}" src="" alt="${escapeHtml(pais)}"></div><span class="font-semibold text-primary">${escapeHtml(pais)}</span></div>
                        <div class="flex items-center gap-3"><span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-black tracking-tighter">${countPais} PROY</span><span class="material-symbols-outlined text-outline-variant pais-icon transition-transform">expand_more</span></div>
                    </div>
                    <div class="pais-panel hidden bg-surface-container-low p-3 space-y-3"></div>`;
                const paisPanel = paisDiv.querySelector(".pais-panel");
                const paisBtn = paisDiv.querySelector(".pais-btn");
                const paisIcon = paisDiv.querySelector(".pais-icon");
                paisBtn.addEventListener("click", (e) => { e.stopPropagation(); paisPanel.classList.toggle("hidden"); paisIcon.classList.toggle("rotate-180"); });
                Object.keys(dataPais).sort().forEach(subtipo => {
                    const subDiv = document.createElement("div");
                    subDiv.className = "space-y-2";
                    subDiv.innerHTML = `<div class="flex items-center gap-2 px-2 pb-1"><span class="material-symbols-outlined text-secondary scale-75">account_balance</span><span class="text-[10px] font-black uppercase tracking-[0.2em] text-outline">${escapeHtml(subtipo)}</span></div><div class="space-y-2"></div>`;
                    const subContent = subDiv.querySelector("div:last-child");
                    dataPais[subtipo].forEach(p => { subContent.appendChild(renderProjectCard(p)); });
                    paisPanel.appendChild(subDiv);
                });
            }
            panel.appendChild(paisDiv);
        });
        projectList.appendChild(contDiv);
    });
    loadFlags();
}

// Función para renderizar cada tarjeta (NUEVO DISEÑO)
function renderProjectCard(p) {
    const statusColors = { 'Planeación': 'bg-orange-500 text-white', 'Ejecución': 'bg-green-600 text-white', 'Finalizado': 'bg-gray-400 text-white' };
    const colorClass = statusColors[p.status] || 'bg-gray-400 text-white';
    const card = document.createElement("div");
    card.className = "bg-surface-container-lowest rounded-xl border border-secondary/10 overflow-hidden mb-3";
    card.innerHTML = `
        <div class="p-4 flex items-center justify-between cursor-pointer project-btn hover:bg-surface-container/50 transition-colors"><h3 class="font-headline font-bold text-sm text-primary">${escapeHtml(p.Nombredelproyecto)}</h3><span class="material-symbols-outlined text-outline-variant project-icon transition-transform">expand_more</span></div>
        <div class="project-panel hidden p-5 space-y-6 border-t border-surface-container">
            <div class="grid grid-cols-2 gap-4"><div class="bg-surface-container-low p-3 rounded-lg flex items-center gap-3"><span class="material-symbols-outlined text-secondary text-sm">calendar_today</span><div><p class="text-[9px] uppercase tracking-widest text-outline font-bold">Inicio</p><p class="text-xs font-semibold text-primary">${p.Fechadeinicio || '---'}</p></div></div>
            <div class="bg-surface-container-low p-3 rounded-lg flex items-center gap-3"><span class="material-symbols-outlined text-secondary text-sm">event_available</span><div><p class="text-[9px] uppercase tracking-widest text-outline font-bold">Término</p><p class="text-xs font-semibold text-primary">${p.Fechadetermino || '---'}</p></div></div></div>
            <div class="flex gap-4"><div class="w-1 bg-secondary rounded-full"></div><div class="flex-1"><h4 class="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Objetivo Estratégico</h4><p class="text-sm text-on-surface-variant leading-relaxed">${escapeHtml(p.Objetivo || 'Sin objetivo definido.')}</p></div></div>
            ${p.Estados && p.Estados.length ? `<div><h4 class="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">ESTADOS DE LA REPÚBLICA</h4><div class="space-y-1.5">${p.Estados.map(e => `<div class="flex items-center gap-2"><span class="text-secondary text-sm">•</span><span class="text-sm text-on-surface-variant font-medium">${escapeHtml(e)}</span></div>`).join("")}</div></div>` : '<div class="hidden"></div>'}
            ${p.notas ? `<div class="bg-surface-container-high/50 p-4 rounded-xl border-l-4 border-outline-variant"><div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined text-outline text-xs">sticky_note_2</span><span class="text-[9px] font-black uppercase tracking-widest text-outline">Observaciones Técnicas</span></div><p class="text-[11px] italic text-on-surface-variant">${escapeHtml(p.notas)}</p></div>` : ""}
            <div class="flex items-center justify-between pt-2 border-t border-surface-container"><span class="px-3 py-1 ${colorClass} text-[10px] font-black rounded-full uppercase tracking-widest">${p.status}</span><button data-id="${p.id}" class="btn-download text-secondary text-xs font-bold flex items-center gap-1">Descargar Ficha<span class="material-symbols-outlined text-sm">download</span></button></div>
        </div>`;
    const projectBtn = card.querySelector(".project-btn");
    const projectPanel = card.querySelector(".project-panel");
    const projectIcon = card.querySelector(".project-icon");
    projectBtn.addEventListener("click", (e) => { e.stopPropagation(); projectPanel.classList.toggle("hidden"); projectIcon.classList.toggle("rotate-180"); });
    const downloadBtn = card.querySelector(".btn-download");
    if (downloadBtn) downloadBtn.addEventListener("click", (e) => { e.stopPropagation(); alert(`📄 Preparando ficha del proyecto: ${p.Nombredelproyecto}\n\nPróximamente podrás descargar la ficha completa en PDF.`); });
    return card;
}

function loadFlags() {
    document.querySelectorAll('.flag-img').forEach(img => {
        const pais = img.getAttribute('data-pais');
        if (pais) {
            const paisCodigo = getCountryCode(pais);
            img.src = `https://flagcdn.com/w40/${paisCodigo}.png`;
            img.onerror = () => { img.style.display = 'none'; img.insertAdjacentHTML('afterend', '<span class="text-sm">🏳️</span>'); };
        }
    });
}

function getCountryCode(pais) {
    const codes = { /* ... mantén tu objeto de códigos extenso ... */ };
    return codes[pais] || 'un';
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    const total = proyectos.length;
    const ejecucion = proyectos.filter(p => p.status === "Ejecución").length;
    const planeacion = proyectos.filter(p => p.status === "Planeación").length;
    const finalizado = proyectos.filter(p => p.status === "Finalizado").length;

    const countEjecucion = document.getElementById("countEjecucion");
    const countPlaneacion = document.getElementById("countPlaneacion");
    const countFinalizado = document.getElementById("countFinalizado");
    const countTotal = document.getElementById("countTotal");
    const progressBar = document.getElementById("progressBar");

    if (countEjecucion) countEjecucion.textContent = ejecucion;
    if (countPlaneacion) countPlaneacion.textContent = planeacion;
    if (countFinalizado) countFinalizado.textContent = finalizado;
    if (countTotal) countTotal.textContent = total;
    if (progressBar && total > 0) progressBar.style.width = `${((ejecucion + finalizado) / total) * 100}%`;
    
    console.log(`Stats actualizadas: Total=${total}, Ejecución=${ejecucion}, Planeación=${planeacion}, Finalizado=${finalizado}`);
}

function populateResponsibles() { /* ... */ }
function populateStates() { /* ... */ }

function renderNormateca() { /* ... */ }
function renderCapacitaciones() { /* ... */ }
function renderInvestigacion() { /* ... */ }
function activarAcordeon() { /* ... */ }
function abrirCapacitacion(id){ window.location.href = `capacitacion.html?id=${id}`; }

/* ============================================================
   🔵 6. EVENTOS (Versión simplificada y corregida)
   ============================================================*/
function attachEvents() {
    searchInput?.addEventListener("input", renderList);
    filterResponsible?.addEventListener("change", renderList);
    filterStatus?.addEventListener("change", renderList);
    filterState?.addEventListener("change", renderList);
    btnExportPDF?.addEventListener("click", exportPDF);
    btnExportXLS?.addEventListener("click", exportXLS);
    btnImportJSON?.addEventListener("click", importJSON);

    // Menú desplegable
    if (btnMenu && menuPanel) {
        btnMenu.addEventListener("click", (e) => { e.stopPropagation(); menuPanel.classList.toggle("hidden"); });
        document.addEventListener("click", (e) => { if (!menuPanel.contains(e.target) && !btnMenu.contains(e.target)) menuPanel.classList.add("hidden"); });
        document.getElementById("menuProyectosEntregados")?.addEventListener("click", () => { menuPanel.classList.add("hidden"); alert("🔍 Mostrando proyectos entregados\n\nPróximamente: Filtro de proyectos finalizados."); });
        document.getElementById("menuFichasTecnicas")?.addEventListener("click", () => { menuPanel.classList.add("hidden"); alert("📄 Fichas Técnicas\n\nPróximamente: Generación de fichas técnicas de proyectos."); });
    }

    // Tabs principales
    const tabsHandler = (tabId) => {
        const sections = ['projectList', 'normatecaSection', 'gestionSection', 'reportsSection'];
        sections.forEach(sec => document.getElementById(sec)?.classList.add('hidden'));
        const target = document.getElementById(tabs[tabId].section);
        if (target) target.classList.remove('hidden');
        const filterDiv = document.getElementById("filterSection");
        if (filterDiv) tabs[tabId].filters ? filterDiv.classList.remove('hidden') : filterDiv.classList.add('hidden');
        if (tabId === 'tabnormateca') renderNormateca();
        if (tabId === 'tabgestion') { renderCapacitaciones(); renderInvestigacion(); }
        updateStatsVisibilityBasedOnTab(); // Controla statsSection
    };

    const tabs = { tabProyectos: { section: 'projectList', filters: 'filterSection' }, tabnormateca: { section: 'normatecaSection', filters: null }, tabgestion: { section: 'gestionSection', filters: null }, tabReportes: { section: 'reportsSection', filters: null } };
    Object.keys(tabs).forEach(tabId => document.getElementById(tabId)?.addEventListener("click", () => tabsHandler(tabId)));

    // Subtabs Proyectos/Acciones + Control de statsSection
    const subtabProyectos = document.getElementById("subtabProyectos");
    const subtabAcciones = document.getElementById("subtabAcciones");
    const projectListSection = document.getElementById("projectList");
    const accionesSection = document.getElementById("accionesSection");
    const statsSectionGlobal = document.getElementById("statsSection");

    function updateStatsVisibilityBasedOnSubtab() {
        if (!statsSectionGlobal) return;
        const isProyectosVisibles = projectListSection && !projectListSection.classList.contains('hidden');
        statsSectionGlobal.classList.toggle('hidden', !isProyectosVisibles);
    }
    function updateStatsVisibilityBasedOnTab() {
        if (!statsSectionGlobal) return;
        const isActiveTabProyectos = document.getElementById("tabProyectos")?.classList.contains("active-tab");
        statsSectionGlobal.classList.toggle('hidden', !isActiveTabProyectos);
    }

    if (subtabProyectos && subtabAcciones) {
        const resetProyectos = () => { if (projectListSection) { projectListSection.classList.remove('hidden'); if (accionesSection) accionesSection.classList.add('hidden'); } updateStatsVisibilityBasedOnSubtab(); renderList(); };
        const resetAcciones = () => { if (projectListSection) projectListSection.classList.add('hidden'); if (accionesSection) accionesSection.classList.remove('hidden'); updateStatsVisibilityBasedOnSubtab(); };
        subtabProyectos.addEventListener("click", resetProyectos);
        subtabAcciones.addEventListener("click", resetAcciones);
        if (accionesSection) accionesSection.classList.add('hidden');
        updateStatsVisibilityBasedOnSubtab();
    }
    updateStatsVisibilityBasedOnTab();

    // Tabs de Gestión
    if (tabCapacitaciones && tabInvestigacion) {
        const resetCapacitaciones = () => { tabCapacitaciones.classList.add("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow"); tabCapacitaciones.classList.remove("text-on-surface-variant"); tabInvestigacion.classList.remove("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow"); tabInvestigacion.classList.add("text-on-surface-variant"); document.getElementById("gestionCapacitaciones")?.classList.remove("hidden"); document.getElementById("gestionInvestigacion")?.classList.add("hidden"); renderCapacitaciones(); };
        const resetInvestigacion = () => { tabInvestigacion.classList.add("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow"); tabInvestigacion.classList.remove("text-on-surface-variant"); tabCapacitaciones.classList.remove("bg-surface-container-lowest", "text-secondary", "diplomatic-shadow"); tabCapacitaciones.classList.add("text-on-surface-variant"); document.getElementById("gestionCapacitaciones")?.classList.add("hidden"); document.getElementById("gestionInvestigacion")?.classList.remove("hidden"); renderInvestigacion(); };
        tabCapacitaciones.addEventListener("click", resetCapacitaciones);
        tabInvestigacion.addEventListener("click", resetInvestigacion);
        resetCapacitaciones();
    }
}

function exportPDF() { /* ... */ }
function exportXLS() { /* ... */ }
function importJSON() { /* ... */ }

// Iniciar la aplicación
init();
