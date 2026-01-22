/* ============================================================
   app.js - Versión UI Mejorada (DG Cooperación)
   ============================================================ */

const LS_KEY = "dg_proyectos_v2";

/* ============================================================
   DOM ELEMENTS
   ============================================================ */

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

/* ============================================================
   FORM FIELDS
   ============================================================ */

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

/* ============================================================
   DATA
   ============================================================ */

let proyectos = [];
let normatecaDocs = [];

const PAISES_CON_SUBTIPO = ["Japón", "Chile", "Estados Unidos", "Noruega"];
const CAMPO_SUBTIPO = "Tipo de proyecto";


/* ============================================================
   GESTIÓN
   ============================================================ */

let gestionData = null;
let gestionLoaded = false;

const GESTION_URL =
  "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/gestion.json";

async function loadGestion() {
  if (gestionLoaded) return;

  try {
    const res = await fetch(GESTION_URL);
    if (!res.ok) throw new Error("No se pudo cargar gestion.json");

    gestionData = await res.json();

    renderFormacion();
    renderInvestigacion();
    renderDocumentos();
    attachGestionSubtabs();

    gestionLoaded = true;
  } catch (err) {
    console.warn("Error cargando Gestión:", err);
  }
}

/* ============================================================
   RENDER GESTIÓN
   ============================================================ */

function renderFormacion() {
  const cont = document.getElementById("gestion-formacion");
  if (!cont || !gestionData?.formacion) return;

  cont.innerHTML = "";

  gestionData.formacion.forEach(item => {
    cont.innerHTML += `
      <div class="bg-white p-4 rounded-2xl border shadow-sm mb-4">
        <h4 class="font-bold text-emerald-600">${escapeHtml(item.titulo)}</h4>
        <p class="text-sm text-slate-600 mt-1">${escapeHtml(item.descripcion)}</p>
        <span class="text-[10px] uppercase font-bold text-slate-400">
          Estado: ${escapeHtml(item.estado)}
        </span>
      </div>
    `;
  });
}

function renderInvestigacion() {
  const cont = document.getElementById("gestion-investigacion");
  if (!cont || !gestionData?.investigacion) return;

  cont.innerHTML = "";

  gestionData.investigacion.forEach(item => {
    cont.innerHTML += `
      <div class="bg-white p-4 rounded-2xl border shadow-sm mb-4">
        <h4 class="font-bold text-indigo-600">${escapeHtml(item.titulo)}</h4>
        <p class="text-sm text-slate-600 mt-1">${escapeHtml(item.descripcion)}</p>
        <span class="text-[10px] uppercase font-bold text-slate-400">
          Estado: ${escapeHtml(item.estado)}
        </span>
      </div>
    `;
  });
}

function renderDocumentos() {
  const cont = document.getElementById("gestion-documentos");
  if (!cont || !gestionData?.documentos) return;

  cont.innerHTML = "";

  gestionData.documentos.forEach(doc => {
    cont.innerHTML += `
      <a href="${doc.archivo}" target="_blank"
         class="flex items-center gap-2 text-indigo-600 text-sm mb-3">
        <i class="fas fa-file-pdf"></i>
        ${escapeHtml(doc.nombre)}
      </a>
    `;
  });
}

/* ============================================================
   SUBTABS GESTIÓN
   ============================================================ */

function attachGestionSubtabs() {
  const btnFormacion = document.getElementById("btn-formacion");
  const btnInvestigacion = document.getElementById("btn-investigacion");
  const formacion = document.getElementById("gestion-formacion");
  const investigacion = document.getElementById("gestion-investigacion");

  if (!btnFormacion || !btnInvestigacion) return;

  btnFormacion.onclick = () => {
    formacion.classList.remove("hidden");
    investigacion.classList.add("hidden");
    btnFormacion.classList.add("bg-white", "text-emerald-600");
    btnInvestigacion.classList.remove("bg-white", "text-emerald-600");
  };

  btnInvestigacion.onclick = () => {
    investigacion.classList.remove("hidden");
    formacion.classList.add("hidden");
    btnInvestigacion.classList.add("bg-white", "text-emerald-600");
    btnFormacion.classList.remove("bg-white", "text-emerald-600");
  };
}


/* ============================================================
   VISTAS PRINCIPALES
   ============================================================ */

function showView(id) {
  document.querySelectorAll(".app-view").forEach(v => v.classList.add("hidden"));
  const active = document.getElementById(id);
  if (active) active.classList.remove("hidden");
}

/* ============================================================
   CARGA DE DATOS
   ============================================================ */

async function loadFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/proyectos.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
}

async function loadnormatecaFromJsonUrl() {
  try {
    const url = "https://raw.githubusercontent.com/DanonninoPlus/DGCIDCIENCIA/main/normateca.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
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
   INIT
   ============================================================ */

async function init() {
  const gh = await loadFromJsonUrl();
  proyectos = gh.length ? gh : loadFromStorage();
  saveToStorage();

  normatecaDocs = await loadnormatecaFromJsonUrl();

  renderList();
  populateResponsibles();
  attachEvents();
}

init();

/* ============================================================
   HELPERS
   ============================================================ */

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 9);
}

function escapeHtml(text) {
  return text
    ? text.replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
    : "";
}

/* ============================================================
   🔽 TODO TU CÓDIGO DE:
   renderList()
   renderFormacion()
   renderInvestigacion()
   renderDocumentos()
   renderNormateca()
   modal / exportaciones / CRUD
   👉 SE MANTIENE TAL CUAL
   (NO SE MODIFICÓ)
   ============================================================ */

/* ============================================================
   TABS PRINCIPALES
   ============================================================ */

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

  const tabs = {
    tabProyectos: "projectList",
    tabnormateca: "normatecaSection",
    tabGestion: "view-gestion",
    tabReportes: "reportsSection"
  };

  Object.keys(tabs).forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    tab.onclick = () => {
      Object.values(tabs).forEach(v => document.getElementById(v).classList.add("hidden"));
      showView(tabs[tabId]);

      if (tabId === "tabGestion") loadGestion();
      if (tabId === "tabnormateca") renderNormateca();
    };
  });
}
