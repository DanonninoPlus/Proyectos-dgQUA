
//LÍNEA PARA AGREGAR EL ARREGLO DE INSTITUCIONES

function renderLista(lista, contenedorId){

const contenedor = document.getElementById(contenedorId);

if(!lista || !Array.isArray(lista)) return;

lista.forEach(item => {

const li = document.createElement("li");

li.className = "flex items-center gap-2";

li.innerHTML = `
<span class="w-1 h-1 bg-primary rounded-full"></span>
${item}
`;

contenedor.appendChild(li);

});

}

//LINEAS PARA LLENAR EL CONTENIDO EN EL HTML
async function cargarCapacitacion() {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const url = "https://raw.githubusercontent.com/DanonninoPlus/Proyectos-dgQUA/main/capacitaciones.json";

  const res = await fetch(url);
  const data = await res.json();

  let capacitacionEncontrada = null;
  let paisEncontrado = "";

  Object.entries(data).forEach(([pais, info]) => {

    info.capacitaciones.forEach(cap => {

      if (cap.id === id) {
        capacitacionEncontrada = cap;
        paisEncontrado = pais;
      }

    });

  });

  if (!capacitacionEncontrada) return;

  document.getElementById("tituloCapacitacion").textContent = capacitacionEncontrada.titulo;
  document.getElementById("paisCapacitacion").textContent = paisEncontrado;

  document.getElementById("etapaCapacitacion").textContent = capacitacionEncontrada.etapa || "---";
  document.getElementById("descripcionCapacitacion").textContent = capacitacionEncontrada.descripcion || "---";
  
  document.getElementById("iniciodifusionCapacitacion").textContent = capacitacionEncontrada.iniciodifusion || "---";
  document.getElementById("findifusionCapacitacion").textContent = capacitacionEncontrada.findifusion || "---";
  document.getElementById("dtedifusionCapacitacion").textContent = capacitacionEncontrada.dtedifusion || "---";
  document.getElementById("vigenciaCapacitacion").textContent = capacitacionEncontrada.vigencia || "---";
  document.getElementById("dtepromoCapacitacion").textContent = capacitacionEncontrada.dtepromo || "---";
  document.getElementById("dteresultadosCapacitacion").textContent = capacitacionEncontrada.dteresultados || "---";
  document.getElementById("aceptadosCapacitacion").textContent = capacitacionEncontrada.aceptados || "---";
  document.getElementById("rechazadosCapacitacion").textContent = capacitacionEncontrada.rechazados || "---";
  document.getElementById("notascapCapacitacion").textContent = capacitacionEncontrada.notascap || "---";


  // No puedo repetir el ID en el mismo HTML; por lo que asignaré un nuevo id a la información que necesito repetir

  
document.getElementById("tituloGeneralCapacitacion").textContent = capacitacionEncontrada.titulo;
document.getElementById("descripcionGeneralCapacitacion").textContent = capacitacionEncontrada.descripcion || "---";
document.getElementById("etapaGeneralCapacitacion").textContent = capacitacionEncontrada.etapa || "---";

//Solo para Institutiones por generar un arreglo en el .json

    // document.getElementById("institucionesdifCapacitacion").textContent = capacitacionEncontrada.institucionesdif || "---";
    // document.getElementById("institucionespartCapacitacion").textContent = capacitacionEncontrada.institucionespart || "---";

renderLista(
capacitacionEncontrada.institucionesdif,
"institucionesdifCapacitacion"
);

renderLista(
capacitacionEncontrada.institucionespart,
"institucionespartCapacitacion"
);



// CONTROL DE ETAPAS Y PROGRESO

const etapaActual = capacitacionEncontrada.etapa;

const estados = {
  "RECEPCIÓN": 1,
  "DIFUSIÓN": 2,
  "PROMOCIÓN": 3,
  "CONFIRMACIÓN": 4
};

const etapaNumero = estados[etapaActual] || 1;

for (let i = 1; i <= 4; i++) {

  const elemento = document.getElementById("estadoEtapa" + i);

  if (!elemento) continue;

  if (i < etapaNumero) {

    elemento.textContent = "COMPLETADO";
    elemento.classList.add(
      "bg-emerald-100",
      "dark:bg-emerald-900/30",
      "text-emerald-600",
      "dark:text-emerald-400"
    );

  } else if (i === etapaNumero) {

    elemento.textContent = "EN CURSO";
    elemento.classList.add(
      "bg-primary",
      "text-white"
    );

  } else {

    elemento.textContent = "PENDIENTE";
    elemento.classList.add(
      "bg-slate-200",
      "dark:bg-slate-700",
      "text-slate-500"
    );

  }

}

// PROGRESO
const progreso = Math.round((etapaNumero / 4) * 100);
document.getElementById("progresoCapacitacion").textContent = progreso + "%";

}

cargarCapacitacion();
