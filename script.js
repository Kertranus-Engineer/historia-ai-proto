import {
  crearPerfil,
  crearEstadoInicial,
  pushMemoria,
  resumenMemoriaCorta,
  aplicarImpacto
} from "./engine.js";

let perfil = null;
let estado = null;
let datosUsuario = {};

function tonoPorPerfil(p) {
  if (p?.tono === "oscuro") return "El ambiente se siente pesado y hostil.";
  if (p?.tono === "esperanzador") return "A pesar de todo, hay señales de salida.";
  if (p?.tono === "comico") return "Tu cerebro hace chistes malos para no colapsar.";
  return "Todo se siente tenso.";
}

function generarEventoBase() {
  if (perfil?.genero === "horror") return "Un susurro te llama desde donde no hay nadie.";
  if (perfil?.genero === "ciencia ficcion") return "Un pitido metálico se repite como señal de auxilio.";
  if (perfil?.genero === "fantasia") return "La niebla revela un símbolo antiguo marcado en tierra.";
  return "El entorno parece inestable, como si algo hubiera ocurrido hace poco.";
}

const ESCENAS = {
  1: () => ({
    texto: `${tonoPorPerfil(perfil)}
Despiertas en ${datosUsuario.lugar}.
${generarEventoBase()}
Tu miedo (${datosUsuario.miedo}) te aprieta el pecho.
Piensas en ${datosUsuario.deseo}, pero juras que algo te observa.

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Enfrentar", go: 2, impacto: { valor: +1 } },
      { texto: "Huir", go: 3, impacto: { tension: +1 } },
      { texto: "Investigar", go: 4, impacto: { misterio: +1 } }
    ]
  }),
  2: () => ({
    texto: `Te pones de pie. Una silueta aparece entre el humo.\nMemoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Hablar", go: 4, impacto: { moralidad: +1 } },
      { texto: "Prepararte", go: 3, impacto: { tension: +1 } }
    ]
  }),
  3: () => ({
    texto: `Corres. Tropiezas. Te raspas.\nMemoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Respirar y pensar", go: 4, impacto: { salud: -1 } },
      { texto: "Seguir corriendo", go: 4, impacto: { tension: +1 } }
    ]
  }),
  4: () => ({
    texto: `Encuentras una salida parcial. (Demo)\n\nESTADO: salud=${estado.salud}, tension=${estado.tension}, misterio=${estado.misterio}, valor=${estado.valor}`,
    opciones: [
      { texto: "Reiniciar", go: 1, impacto: { reset: true } }
    ]
  })
};

function render() {
  const data = ESCENAS[estado.escena]();

  const imgEl = document.getElementById("imagen");
  imgEl.removeAttribute("src"); // sin imágenes todavía

  document.getElementById("texto").innerText = data.texto;

  const cont = document.getElementById("opciones");
  cont.innerHTML = "";
  data.opciones.forEach((op, idx) => {
    const b = document.createElement("button");
    b.textContent = op.texto;
    b.addEventListener("click", () => elegir(idx));
    cont.appendChild(b);
  });
}

function elegir(i) {
  const data = ESCENAS[estado.escena]();
  const op = data.opciones[i];
  if (!op) return;

  if (op.impacto?.reset) {
    estado = crearEstadoInicial();
    pushMemoria(estado, "Reiniciaste la historia.");
    render();
    return;
  }

  aplicarImpacto(estado, op.impacto);
  pushMemoria(estado, `Elegiste: ${op.texto}`);
  estado.escena = op.go;
  render();
}

function iniciar() {
  datosUsuario = {
    lugar: document.getElementById("lugar").value.trim() || "un lugar desconocido",
    miedo: document.getElementById("miedo").value.trim() || "algo innombrable",
    deseo: document.getElementById("deseo").value.trim() || "una salida"
  };

  perfil = crearPerfil({
    genero: document.getElementById("genero").value,
    tono: document.getElementById("tono").value,
    intensidad: Number(document.getElementById("intensidad").value),
    protagonista: "normal",
    tema: "misterio"
  });

  estado = crearEstadoInicial();
  pushMemoria(estado, "Despertaste sin entender cómo llegaste.");

  document.getElementById("intro").style.display = "none";
  document.getElementById("juego").style.display = "block";

  render();
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnComenzar");
  btn.addEventListener("click", iniciar);
});
