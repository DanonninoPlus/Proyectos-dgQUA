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

  document.getElementById("institucionCapacitacion").textContent = capacitacionEncontrada.institucion || "---";
  document.getElementById("fechaCapacitacion").textContent = capacitacionEncontrada.fecha || "---";
  document.getElementById("descripcionCapacitacion").textContent = capacitacionEncontrada.descripcion || "---";

}

cargarCapacitacion();