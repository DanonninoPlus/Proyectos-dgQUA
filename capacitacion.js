
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
  document.getElementById("rechazdosCapacitacion").textContent = capacitacionEncontrada.rechazdos || "---";
  document.getElementById("notascapCapacitacion").textContent = capacitacionEncontrada.notascap || "---";

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


}

cargarCapacitacion();
