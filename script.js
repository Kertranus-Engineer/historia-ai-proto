// script.js (REEMPLAZA tu función render() completa por esta)

import { crearEstadoInicial, aplicarImpacto, pushMemoria } from "./engine.js";
import { generarEscena } from "./generator.js";
import { hashScene, buildPrompt, getCachedImage, setCachedImage } from "./image.js";

let estado = null;
let datosUsuario = null;
let perfil = null;
let escenaActual = null;

function $(id){ return document.getElementById(id); }

function cargarPartida() {
  try {
    const raw = localStorage.getItem("historiaAI_save_v1");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarPartida() {
  try {
    localStorage.setItem("historiaAI_save_v1", JSON.stringify({ estado, datosUsuario, perfil }));
  } catch {}
}

function limpiarPartida() {
  localStorage.removeItem("historiaAI_save_v1");
}

function mostrarIntro() {
  $("intro").style.display = "block";
  $("juego").style.display = "none";
}

function mostrarJuego() {
  $("intro").style.display = "none";
  $("juego").style.display = "block";
}

function aplicarSonido(id) {
  const el = $(id);
  if (!el) return;
  try { el.currentTime = 0; el.play(); } catch {}
}

function finalTexto() {
  if (estado.salud <= 0) return "FINAL: Caíste. Te faltó suerte o te sobró intensidad.";
  if (estado.turno >= 12) return "FINAL: Llegaste al final de esta ruta. Sobreviviste… por ahora.";
  if (estado.misterio >= 6) return "FINAL: Descubriste un secreto grande. No podrás olvidar lo que viste.";
  if (estado.valor >= 6) return "FINAL: Te convertiste en alguien que no retrocede.";
  if (estado.tension >= 8) return "FINAL: Tu mente se quebró antes que tu cuerpo.";
  return null;
}

// =========================
// ✅ ESTA ES LA QUE PEDISTE
// =========================
function render() {
  if (!estado || !datosUsuario || !perfil) {
    mostrarIntro();
    return;
  }

  // ¿terminó?
  const fin = finalTexto();
  if (fin) {
    mostrarJuego();

    const textoFin =
`${fin}

ESTADO FINAL
salud=${estado.salud}
tension=${estado.tension}
misterio=${estado.misterio}
moralidad=${estado.moralidad}
valor=${estado.valor}
inventario=${(estado.inventario || []).join(", ") || "vacío"}

Memoria: ${(estado.memoria || []).slice(-2).join(" | ") || "vacía"}`;

    $("texto").innerText = textoFin;
    if ($("promptVisual")) $("promptVisual").innerText = "";
    if ($("debugEstado")) $("debugEstado").innerText = "";

    $("opciones").innerHTML = "";

    const imgEl = $("imagen");
    imgEl.src = imgEl.src || "https://via.placeholder.com/900x450?text=FINAL";

    const btnReiniciar = document.createElement("button");
    btnReiniciar.textContent = "Reiniciar";
    btnReiniciar.className = "btn";
    btnReiniciar.onclick = () => {
      estado = crearEstadoInicial();
      guardarPartida();
      render();
    };

    const btnVolver = document.createElement("button");
    btnVolver.textContent = "Volver al inicio";
    btnVolver.className = "btn secondary";
    btnVolver.onclick = () => { mostrarIntro(); };

    const btnBorrar = document.createElement("button");
    btnBorrar.textContent = "Borrar partida";
    btnBorrar.className = "btn danger";
    btnBorrar.onclick = () => {
      limpiarPartida();
      estado = null;
      datosUsuario = null;
      perfil = null;
      escenaActual = null;
      mostrarIntro();
    };

    $("opciones").appendChild(btnReiniciar);
    $("opciones").appendChild(btnVolver);
    $("opciones").appendChild(btnBorrar);
    return;
  }

  // genera escena
  escenaActual = generarEscena({ estado, perfil, datosUsuario });
  mostrarJuego();

  // Imagen/PROMPT pipeline
  const sceneId = hashScene(escenaActual.meta, escenaActual.texto);
  const prompt = buildPrompt({ perfil, datosUsuario, meta: escenaActual.meta });

  // Historia sin debug
  $("texto").innerText = escenaActual.texto;

  // Prompt en panel aparte
  if ($("promptVisual")) $("promptVisual").innerText = prompt;

  // Debug estado (bonito)
  if ($("debugEstado")) {
    const dbg =
`turno=${estado.turno} fase=${escenaActual.meta?.faseKey}
salud=${estado.salud} tension=${estado.tension}
misterio=${estado.misterio} moralidad=${estado.moralidad} valor=${estado.valor}
inventario=${(estado.inventario || []).join(", ") || "vacío"}
memoria=${(estado.memoria || []).slice(-3).join(" | ") || "vacía"}`;
    $("debugEstado").innerText = dbg;
  }

  // Imagen: cache primero
  const imgEl = $("imagen");
  const cached = getCachedImage(sceneId);

  if (cached) {
    imgEl.src = cached;
  } else {
    const safe = encodeURIComponent(
      `${(escenaActual.meta?.faseKey || "escena").toUpperCase()} | ${(perfil.genero || "historia")}`
    );
    const url = `https://via.placeholder.com/900x450?text=${safe}`;
    imgEl.src = url;
    setCachedImage(sceneId, url);
  }

  // opciones
  $("opciones").innerHTML = "";
  (escenaActual.opciones || []).forEach((op, i) => {
    const b = document.createElement("button");
    b.textContent = op.texto;
    b.className = "btn";
    b.onclick = () => elegir(i);
    $("opciones").appendChild(b);
  });

  guardarPartida();
}

function elegir(i) {
  if (!escenaActual) return;
  const op = escenaActual.opciones[i];
  if (!op) return;

  aplicarSonido("sfxClick");

  pushMemoria(estado, `Evento: ${escenaActual.meta?.evento || ""}`);
  pushMemoria(estado, `Elegiste: ${op.texto}`);

  aplicarImpacto(estado, op.impacto || {});

  if (op.consume) {
    estado.inventario = (estado.inventario || []).filter(x => x !== op.consume);
    pushMemoria(estado, `Consumiste: ${op.consume}`);
  }

  if (op.flagSet) {
    estado.flags = estado.flags || {};
    estado.flags[op.flagSet] = true;
    pushMemoria(estado, `Flag: ${op.flagSet}`);
  }

  if (typeof op.efecto === "function") {
    try { op.efecto(estado); } catch {}
  }

  render();
}

// --- init UI (ajusta ids si difieren) ---
document.addEventListener("DOMContentLoaded", () => {
  // cargar save
  const save = cargarPartida();
  if (save?.estado && save?.datosUsuario && save?.perfil) {
    estado = save.estado;
    datosUsuario = save.datosUsuario;
    perfil = save.perfil;
  }

  const btnComenzar = $("btnComenzar");
  if (btnComenzar) {
    btnComenzar.onclick = () => {
      datosUsuario = {
        lugar: ($("lugar")?.value || "un lugar desconocido").trim(),
        miedo: ($("miedo")?.value || "algo").trim(),
        deseo: ($("deseo")?.value || "seguir").trim(),
      };

      perfil = {
        genero: ($("genero")?.value || "supervivencia").trim(),
        tono: ($("tono")?.value || "tenso").trim(),
        intensidad: Number($("intensidad")?.value || 6),
      };

      estado = crearEstadoInicial();
      guardarPartida();
      render();
    };
  }

  const btnContinuar = $("btnContinuar");
  if (btnContinuar) {
    btnContinuar.onclick = () => {
      if (!estado) return;
      render();
    };
  }

  const btnBorrar = $("btnBorrar");
  if (btnBorrar) {
    btnBorrar.onclick = () => {
      limpiarPartida();
      estado = null; datosUsuario = null; perfil = null; escenaActual = null;
      render();
    };
  }

  render();
});

