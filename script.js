import { hashScene, buildPrompt, getCachedImage, setCachedImage } from "./image.js";
import {
  crearPerfil,
  crearEstadoInicial,
  pushMemoria,
  resumenMemoriaCorta,
  aplicarImpacto
} from "./engine.js";

import { generarEscena } from "./generator.js";

let perfil = null;
let estado = null;
let datosUsuario = {};

const KEY_SAVE = "historiaAI_save_v3";

// ===== Save/Load =====
function guardar() {
  const payload = { perfil, estado, datosUsuario, ts: Date.now() };
  localStorage.setItem(KEY_SAVE, JSON.stringify(payload));
}

function cargar() {
  const raw = localStorage.getItem(KEY_SAVE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function borrarSave() {
  localStorage.removeItem(KEY_SAVE);
}

function irJuego() {
  document.getElementById("intro").style.display = "none";
  document.getElementById("juego").style.display = "block";
}

function irIntro() {
  document.getElementById("juego").style.display = "none";
  document.getElementById("intro").style.display = "block";
}

// ===== Final conditions =====
function esFinal() {
  // puedes ajustar esto después
  if (estado.salud <= 0) return "FINAL: Caíste. Te faltó suerte o te sobró intensidad.";
  if (estado.misterio >= 6) return "FINAL: Conectas las piezas. Entiendes qué estaba pasando.";
  if (estado.tension >= 8) return "FINAL: Te sobrepasa la tensión. Te quiebras y huyes.";
  if (estado.valor >= 6) return "FINAL: Te impones. Sales por decisión, no por accidente.";
  return null;
}

// ===== Render loop =====
let escenaActual = null;

function render() {
  const final = esFinal();
  if (final) {
    renderFinal(final);
    guardar();
    return;
  }

  escenaActual = generarEscena({ estado, perfil, datosUsuario });

  document.getElementById("texto").innerText = escenaActual.texto;

  const cont = document.getElementById("opciones");
  cont.innerHTML = "";

  escenaActual.opciones.forEach((op, idx) => {
    const b = document.createElement("button");
    b.textContent = op.texto;
    b.addEventListener("click", () => elegir(idx));
    cont.appendChild(b);
  });

  // sin imágenes aún
  const imgEl = document.getElementById("imagen");
  imgEl.removeAttribute("src");

  guardar();
}

function renderFinal(finalText) {
  document.getElementById("texto").innerText =
`${finalText}

ESTADO FINAL
salud=${estado.salud}
tension=${estado.tension}
misterio=${estado.misterio}
moralidad=${estado.moralidad}
valor=${estado.valor}
inventario=${estado.inventario.join(", ") || "vacío"}

Memoria: ${resumenMemoriaCorta(estado)}
`;

  const cont = document.getElementById("opciones");
  cont.innerHTML = "";

  const b1 = document.createElement("button");
  b1.textContent = "Reiniciar";
  b1.addEventListener("click", () => {
    estado = crearEstadoInicial();
    pushMemoria(estado, "Reiniciaste la historia.");
    render();
  });
  cont.appendChild(b1);

  const b2 = document.createElement("button");
  b2.textContent = "Volver al inicio";
  b2.style.background = "#444";
  b2.addEventListener("click", () => {
    irIntro();
  });
  cont.appendChild(b2);

  const b3 = document.createElement("button");
  b3.textContent = "Borrar partida";
  b3.style.background = "#333";
  b3.addEventListener("click", () => {
    borrarSave();
    alert("Partida borrada");
    irIntro();
  });
  cont.appendChild(b3);
function elegir(i) {
  if (!escenaActual) return;
  const op = escenaActual.opciones[i];
  if (!op) return;

  // memoria
  pushMemoria(estado, `Fase: ${escenaActual.meta?.faseKey || "?"}`);
  pushMemoria(estado, `Ocurre: ${escenaActual.meta?.evento || "evento"}`);
  pushMemoria(estado, `Elegiste: ${op.texto}`);

  // impactos
  aplicarImpacto(estado, op.impacto);

  // consume item
  if (op.consume) {
    estado.inventario = estado.inventario.filter(x => x !== op.consume);
    estado.flags.log = estado.flags.log || [];
    estado.flags.log.push(`Consumiste: ${op.consume}`);
  }

  // set flag
  if (op.flagSet) {
    estado.flags[op.flagSet] = true;
    estado.flags.log = estado.flags.log || [];
    estado.flags.log.push(`Flag: ${op.flagSet}`);
  }

  // efecto opcional (si viene)
  if (typeof op.efecto === "function") {
    op.efecto(estado);
  }

  render();
}

// ===== Start/Continue =====
function iniciarNueva() {
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

  irJuego();
  render();
}

function continuar() {
  const saved = cargar();
  if (!saved) return;

  perfil = saved.perfil;
  estado = saved.estado;
  datosUsuario = saved.datosUsuario;

  // rellena UI
  document.getElementById("lugar").value = datosUsuario.lugar || "";
  document.getElementById("miedo").value = datosUsuario.miedo || "";
  document.getElementById("deseo").value = datosUsuario.deseo || "";
  document.getElementById("genero").value = perfil.genero || "supervivencia";
  document.getElementById("tono").value = perfil.tono || "tenso";
  document.getElementById("intensidad").value = perfil.intensidad ?? 6;

  irJuego();
  render();
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnComenzar").addEventListener("click", iniciarNueva);

  const btnCont = document.getElementById("btnContinuar");
  if (btnCont) btnCont.addEventListener("click", continuar);

  const btnReset = document.getElementById("btnReset");
  if (btnReset) btnReset.addEventListener("click", () => {
    borrarSave();
    alert("Partida borrada");
  });

  // habilita continuar si hay save
  const saved = cargar();
  if (btnCont) btnCont.disabled = !saved;
});


