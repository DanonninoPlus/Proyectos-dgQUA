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
  document.getElementById("institucionesdifCapacitacion").textContent = capacitacionEncontrada.institucionesdif || "---";
  document.getElementById("dtepromoCapacitacion").textContent = capacitacionEncontrada.dtepromo || "---";
  document.getElementById("institucionespartCapacitacion").textContent = capacitacionEncontrada.institucionespart || "---";
  document.getElementById("dteresultadosCapacitacion").textContent = capacitacionEncontrada.dteresultados || "---";
  document.getElementById("aceptadosCapacitacion").textContent = capacitacionEncontrada.aceptados || "---";
  document.getElementById("rechazdosCapacitacion").textContent = capacitacionEncontrada.rechazdos || "---";


}

cargarCapacitacion();
