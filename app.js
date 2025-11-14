// app.js
// Versión prototipo: funciona en local y en hosting estático.
// Dependencias por CDN en index.html: html2pdf y xlsx

/* ---------- Estructura de proyecto ----------
{
  id, name, goal, responsible, progress (0-100), status, notes, createdAt
}
----------------------------------------------*/

const LS_KEY = "dg_proyectos_v1";

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
const projName = document.getElementById("projName");
const projGoal = document.getElementById("projGoal");
const projResponsible = document.getElementById("projResponsible");
const projProgress = document.getElementById("projProgress");
const projStatus = document.getElementById("projStatus");
const projNotes = document.getElementById("projNotes");

let proyectos = loadFromStorage();

// Inicialización
renderList();
populateResponsibles();
attachEvents();

/* ---------- FUNCIONES ---------- */

function loadFromStorage(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return sampleData();
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

function sampleData(){
  const s = [
    {
      id: cryptoRandomId(),
      name: "Fortalecimiento institucional - X",
      goal: "Capacitar a 120 servidores públicos en gestión de proyectos.",
      responsible: "Coordinación A",
      progress: 35,
      status: "Ejecución",
      notes: "Se avanzó con 3 talleres regionales.",
      createdAt: new Date().toISOString()
    },
    {
      id: cryptoRandomId(),
      name: "Programa de intercambio Y",
      goal: "Intercambio académico con país Z.",
      responsible: "Coordinación B",
      progress: 10,
      status: "Planeación",
      notes: "Esperando confirmación de sede.",
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(s));
  return s;
}

function cryptoRandomId(){
  return Math.random().toString(36).slice(2, 9);
}

function renderList(){
  const q = searchInput.value.trim().toLowerCase();
  const respFilter = filterResponsible.value;
  const statusFilter = filterStatus.value;

  projectList.innerHTML = "";
  const filtered = proyectos.filter(p => {
    const matchQ = !q || (p.name + " " + p.goal + " " + p.notes).toLowerCase().includes(q);
    const matchResp = !respFilter || p.responsible === respFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchQ && matchResp && matchStatus;
  });

  if(filtered.length === 0){
    projectList.innerHTML = `<div class="p-4 bg-white rounded shadow text-sm">No hay proyectos.</div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "bg-white rounded shadow";
    card.innerHTML = `
      <button class="w-full text-left px-4 py-3 acordeon-btn flex justify-between items-center">
        <div>
          <div class="font-semibold">${escapeHtml(p.name)}</div>
          <div class="text-xs text-gray-500">${escapeHtml(p.responsible)} · ${p.status} · ${p.progress}%</div>
        </div>
        <div class="text-sm">+ ver</div>
      </button>
      <div class="panel px-4 py-3 border-t hidden">
        <p><strong>Objetivo:</strong> ${escapeHtml(p.goal)}</p>
        <p class="mt-2"><strong>Notas:</strong> ${escapeHtml(p.notes)}</p>
        <div class="mt-3 flex gap-2">
          <button data-id="${p.id}" class="btn-edit px-2 py-1 border rounded text-sm">Editar</button>
          <button data-id="${p.id}" class="btn-delete px-2 py-1 border rounded text-sm text-red-600">Eliminar</button>
        </div>
      </div>
    `;
    projectList.appendChild(card);
  });

  attachAccordionEvents();
  attachEditDeleteEvents();
}

function attachAccordionEvents(){
  const accBtns = document.querySelectorAll(".acordeon-btn");
  accBtns.forEach(btn => {
    btn.onclick = () => {
      const panel = btn.nextElementSibling;
      panel.classList.toggle("hidden");
    };
  });
}

function attachEditDeleteEvents(){
  document.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = (e) => {
      const id = e.target.dataset.id;
      openEditModal(id);
    };
  });
  document.querySelectorAll(".btn-delete").forEach(b => {
    b.onclick = (e) => {
      const id = e.target.dataset.id;
      if(confirm("¿Eliminar este proyecto?")) {
        proyectos = proyectos.filter(p => p.id !== id);
        saveToStorage();
        renderList();
      }
    };
  });
}

function attachEvents(){
  searchInput.addEventListener("input", renderList);
  filterResponsible.addEventListener("change", renderList);
  filterStatus.addEventListener("change", renderList);

  btnAddProject.addEventListener("click", () => openModalForNew());

  btnCancel.addEventListener("click", closeModal);

  projectForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const id = projId.value;
    const data = {
      id: id || cryptoRandomId(),
      name: projName.value.trim(),
      goal: projGoal.value.trim(),
      responsible: projResponsible.value.trim(),
      progress: Number(projProgress.value) || 0,
      status: projStatus.value,
      notes: projNotes.value.trim(),
      createdAt: id ? proyectos.find(p => p.id === id).createdAt : new Date().toISOString()
    };

    if(id){
      proyectos = proyectos.map(p => p.id === id ? data : p);
    } else {
      proyectos.unshift(data); // nuevo al inicio
    }

    saveToStorage();
    closeModal();
    renderList();
  });

  btnExportPDF.addEventListener("click", exportPDF);
  btnExportXLS.addEventListener("click", exportXLS);
  btnImportJSON.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if(Array.isArray(parsed)){
            proyectos = parsed;
            saveToStorage();
            renderList();
            alert("Importado correctamente.");
          } else {
            alert("JSON inválido. Debe ser un arreglo de proyectos.");
          }
        } catch(err){
          alert("Error leyendo JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  });
}

/* ---------- Modal ---------- */

function openModalForNew(){
  modalTitle.textContent = "Nuevo proyecto";
  projId.value = "";
  projName.value = "";
  projGoal.value = "";
  projResponsible.value = "";
  projProgress.value = 0;
  projStatus.value = "Planeación";
  projNotes.value = "";
  showModal();
}

function openEditModal(id){
  const p = proyectos.find(x => x.id === id);
  if(!p) return;
  modalTitle.textContent = "Editar proyecto";
  projId.value = p.id;
  projName.value = p.name;
  projGoal.value = p.goal;
  projResponsible.value = p.responsible;
  projProgress.value = p.progress;
  projStatus.value = p.status;
  projNotes.value = p.notes;
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

/* ---------- Export PDF ---------- */

function exportPDF(){
  // Creamos una copia limpia en printArea
  printArea.innerHTML = "";
  const header = `<div style="font-family: Arial; padding: 10px;"><h2>Reporte de Proyectos</h2><p>Generado: ${new Date().toLocaleString()}</p><hr/></div>`;
  let body = `<div style="font-family: Arial; padding: 10px;">`;
  const rows = proyectos.map(p => {
    return `<div style="margin-bottom:12px;">
      <h3 style="margin:0">${escapeHtml(p.name)}</h3>
      <div style="font-size:12px;color:#555">${escapeHtml(p.responsible)} · ${p.status} · ${p.progress}%</div>
      <p style="margin:6px 0"><strong>Objetivo:</strong> ${escapeHtml(p.goal)}</p>
      <p style="margin:6px 0"><strong>Notas:</strong> ${escapeHtml(p.notes)}</p>
    </div>`;
  }).join("\n");
  body += rows + "</div>";
  printArea.innerHTML = header + body;

  // Opciones para html2pdf
  const opt = {
    margin:       10,
    filename:     `reporte_proyectos_${new Date().toISOString().slice(0,10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(printArea).save();
}

/* ---------- Export Excel (SheetJS) ---------- */

function exportXLS(){
  // Construimos una matriz para SheetJS
  const wb = XLSX.utils.book_new();
  const data = proyectos.map(p => ({
    Nombre: p.name,
    Objetivo: p.goal,
    Responsable: p.responsible,
    Avance: p.progress,
    Estado: p.status,
    Notas: p.notes,
    Creado: p.createdAt
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Proyectos");
  XLSX.writeFile(wb, `proyectos_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/* ---------- Helpers ---------- */

function populateResponsibles(){
  const responsables = Array.from(new Set(proyectos.map(p => p.responsible).filter(x => x && x.trim())));
  // limpiar y poner opciones
  filterResponsible.innerHTML = `<option value="">Filtrar por responsable</option>`;
  responsables.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    filterResponsible.appendChild(opt);
  });
  // También colocar sugerencias en el formulario
  // (dejamos el campo libre para escribir)
}

function escapeHtml(text){
  if(!text) return "";
  return text.replaceAll("&", "&amp;")
             .replaceAll("<", "&lt;")
             .replaceAll(">", "&gt;")
             .replaceAll('"', "&quot;");
}
