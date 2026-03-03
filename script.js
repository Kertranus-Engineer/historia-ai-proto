document.getElementById("btnComenzar").addEventListener("click", () => {
    alert("FUNCIONA");
});
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

// ===== Helpers de narrativa por perfil =====
function tonoPorPerfil(p) {
  if (!p) return "Todo se siente tenso.";
  if (p.tono === "oscuro") return "El ambiente se siente pesado y hostil.";
  if (p.tono === "esperanzador") return "A pesar de todo, hay señales de salida.";
  if (p.tono === "comico") return "Tu cerebro hace chistes malos para no colapsar.";
  return "Todo se siente tenso.";
}

function generarEventoBase() {
  if (perfil?.genero === "horror") {
    return "Un susurro te llama por tu nombre desde un lugar donde no hay nadie.";
  }
  if (perfil?.genero === "ciencia ficcion") {
    return "Un pitido metálico se repite a intervalos, como una señal de auxilio.";
  }
  if (perfil?.genero === "fantasia") {
    return "La niebla se abre y revela un símbolo antiguo marcado en tierra.";
  }
  return "El entorno parece inestable, como si algo hubiera ocurrido hace poco.";
}

function lineaPorIntensidad() {
  const i = perfil?.intensidad ?? 6;
  if (i >= 8) return "Te tiemblan las manos: cualquier error se paga caro.";
  if (i <= 3) return "Tienes margen para pensar: el peligro aún no estalla.";
  return "Sientes presión, pero aún puedes decidir con calma.";
}

function resumenFinal() {
  const final =
    (estado.salud <= 0) ? "FINAL: apenas sobrevives."
    : (estado.misterio >= 3) ? "FINAL: entiendes el patrón."
    : (estado.valor >= 2) ? "FINAL: sales por decisión."
    : "FINAL: escapas sin respuestas.";

  return `ESTADO FINAL
Salud: ${estado.salud}/3
Tensión: ${estado.tension}
Misterio: ${estado.misterio}
Moralidad: ${estado.moralidad}
Valor: ${estado.valor}
Inventario: ${estado.inventario.join(", ") || "vacío"}

Memoria: ${resumenMemoriaCorta(estado)}

${final}`;
}

// ===== Escenas (aún numeradas, pero ya afectan por perfil) =====
const ESCENAS = {
  1: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Despiertas en ${datosUsuario.lugar}.
${generarEventoBase()}
Tu miedo (${datosUsuario.miedo}) te aprieta el pecho.
Piensas en ${datosUsuario.deseo}, pero juras que algo te observa.

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Enfrentar", go: 2, impacto: { valor: +1 } },
      { texto: "Huir", go: 3, impacto: { tension: +1 } },
      { texto: "Investigar", go: 4, impacto: { misterio: +1 } },
    ],
    img: "scene1.jpg"
  }),

  2: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Te pones de pie. Una silueta aparece.
${perfil.genero === "horror" ? "Su rostro parece… borroso." : ""}
${perfil.genero === "ciencia ficcion" ? "Lleva algo brillante en la muñeca." : ""}
${perfil.genero === "fantasia" ? "Su capa parece moverse sola." : ""}

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Hablar", go: 5, impacto: {} },
      { texto: "Prepararte para pelear", go: 6, impacto: { valor: +1, tension: +1 } },
    ],
    img: "scene2.jpg"
  }),

  3: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Te ocultas. Algo brilla en el suelo.
${perfil.genero === "ciencia ficcion" ? "Parece un módulo con luz tenue." : "Parece una pieza metálica vieja."}

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Tomar el objeto", go: 7, impacto: { inventario_add: "llave", misterio: +1 } },
      { texto: "Quedarte quieto", go: 8, impacto: { tension: +1 } },
    ],
    img: "scene3.jpg"
  }),

  4: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Encuentras huellas y un símbolo raro.
${perfil.genero === "fantasia" ? "El símbolo vibra levemente." : ""}
${perfil.genero === "horror" ? "El símbolo parece… mirarte." : ""}
${perfil.genero === "ciencia ficcion" ? "El símbolo coincide con un patrón de señal." : ""}

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Seguir huellas", go: 8, impacto: { misterio: +1 } },
      { texto: "Buscar en casas", go: 9, impacto: { misterio: +1, tension: +1 } },
    ],
    img: "scene4.jpg"
  }),

  5: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

La silueta dice: “No quiero problemas”.
${perfil.genero === "horror" ? "La voz suena como si viniera desde un túnel." : ""}
${perfil.genero === "ciencia ficcion" ? "La voz suena filtrada, como radio." : ""}
${perfil.genero === "fantasia" ? "La voz suena antigua, casi ritual." : ""}

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Negociar", go: 10, impacto: { moralidad: +1 } },
      { texto: "Mentir", go: 6, impacto: { moralidad: -1, tension: +1 } },
    ],
    img: "scene5.jpg"
  }),

  6: () => {
    // daño depende de intensidad
    const i = perfil.intensidad ?? 6;
    const dañoRetiro = i >= 8 ? -2 : -1;
    const dañoPelea = i >= 8 ? -3 : -2;

    return {
      texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Todo escala. Te hieren.
${i >= 8 ? "Sangras más de lo que esperabas." : "Es un corte, pero duele."}

Memoria: ${resumenMemoriaCorta(estado)}`,
      opciones: [
        { texto: "Retirarte", go: 10, impacto: { salud: dañoRetiro } },
        { texto: "Pelear", go: 10, impacto: { salud: dañoPelea, valor: +1 } },
      ],
      img: "scene6.jpg"
    };
  },

  7: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

El objeto encaja en tu mano: ${perfil.genero === "ciencia ficcion" ? "un dispositivo llave" : "una llave vieja"}.
La guardas.

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Volver al camino", go: 8, impacto: {} },
      { texto: "Revisar alrededor", go: 9, impacto: { misterio: +1 } },
    ],
    img: "scene7.jpg"
  }),

  8: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Ves un granero trabado.
${estado.inventario.includes("llave") ? "Tienes una llave." : "No tienes llave."}
${perfil.genero === "horror" ? "El granero está demasiado silencioso." : ""}
${perfil.genero === "ciencia ficcion" ? "La señal del pitido parece venir de ahí." : ""}
${perfil.genero === "fantasia" ? "La madera tiene runas marcadas." : ""}

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      {
        texto: estado.inventario.includes("llave") ? "Usar llave" : "Forzar puerta",
        go: 9,
        impacto: estado.inventario.includes("llave")
          ? { misterio: +1 }
          : { salud: (perfil.intensidad >= 8 ? -2 : -1), tension: +1 }
      },
      { texto: "Alejarte", go: 10, impacto: {} },
    ],
    img: "scene8.jpg"
  }),

  9: () => ({
    texto: `${tonoPorPerfil(perfil)}
${lineaPorIntensidad()}

Encuentras un mapa y una nota sobre "${datosUsuario.deseo}".
${perfil.genero === "horror" ? "La tinta está fresca. Imposible." : ""}
${perfil.genero === "ciencia ficcion" ? "Hay coordenadas y un checksum raro." : ""}
${perfil.genero === "fantasia" ? "La nota tiene un sello arcano." : ""}

Memoria: ${resumenMemoriaCorta(estado)}`,
    opciones: [
      { texto: "Leer nota", go: 10, impacto: { misterio: +1 } },
      { texto: "Ignorar y seguir", go: 10, impacto: { tension: +1 } },
    ],
    img: "scene9.jpg"
  }),

  10: () => ({
    texto: resumenFinal(),
    opciones: [
      { texto: "Reiniciar", go: 1, impacto: { reset: true } },
      { texto: "Cambiar perfil", go: 99, impacto: { reset: true } },
    ],
    img: "scene10.jpg"
  })
};

// ===== Render =====
function render() {
  const escenaFn = ESCENAS[estado.escena];
  const data = escenaFn();

  const imgEl = document.getElementById("imagen");
  imgEl.src = data.img;
  imgEl.onerror = () => { imgEl.removeAttribute("src"); imgEl.style.background = "#222"; };

  document.getElementById("texto").innerText = data.texto;

  document.getElementById("opciones").innerHTML = data.opciones
    .map((op, i) => `<button data-i="${i}">${op.texto}</button>`)
    .join("");

  document.querySelectorAll("#opciones button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.target.dataset.i);
      elegir(i);
    });
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

  if (estado.escena === 99) {
    document.getElementById("juego").style.display = "none";
    document.getElementById("intro").style.display = "block";
    return;
  }

  render();
}

// ===== Inicio (perfil real + guardar/cargar) =====
function iniciar() {
  datosUsuario.lugar = document.getElementById("lugar").value.trim() || "un lugar desconocido";
  datosUsuario.miedo = document.getElementById("miedo").value.trim() || "algo que no puedes nombrar";
  datosUsuario.deseo = document.getElementById("deseo").value.trim() || "una salida";

  perfil = crearPerfil({
    genero: document.getElementById("genero").value,
    tono: document.getElementById("tono").value,
    intensidad: Number(document.getElementById("intensidad").value),
    protagonista: "normal",
    tema: "misterio"
  });

  localStorage.setItem("perfilHistoriaIA", JSON.stringify(perfil));

  estado = crearEstadoInicial();
  pushMemoria(estado, "Despertaste sin entender cómo llegaste.");

  document.getElementById("intro").style.display = "none";
  document.getElementById("juego").style.display = "block";

  render();
}

window.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("DOMContentLoaded", () => {
  console.log("JS cargado OK");

  const btn = document.getElementById("btnComenzar") || document.getElementById("btncomenzar");
  if (btn) {
    btn.addEventListener("click", iniciar);
    console.log("Botón conectado por ID");
  } else {
    // fallback: primer botón dentro de intro
    const fallback = document.querySelector("#intro button");
    if (fallback) {
      fallback.addEventListener("click", iniciar);
      console.log("Botón conectado por fallback (#intro button)");
    } else {
      console.error("No encontré botón en #intro");
    }
  }

  // cargar perfil guardado (si existe)
  const perfilGuardado = localStorage.getItem("perfilHistoriaIA");
  if (perfilGuardado) {
    try {
      const p = JSON.parse(perfilGuardado);
      const g = document.getElementById("genero");
      const t = document.getElementById("tono");
      const inx = document.getElementById("intensidad");
      if (g) g.value = p.genero;
      if (t) t.value = p.tono;
      if (inx) inx.value = p.intensidad;
    } catch {}
  }
});

  // cargar perfil guardado
  const perfilGuardado = localStorage.getItem("perfilHistoriaIA");
  if (perfilGuardado) {
    try {
      const p = JSON.parse(perfilGuardado);
      const g = document.getElementById("genero");
      const t = document.getElementById("tono");
      const inx = document.getElementById("intensidad");
      if (g) g.value = p.genero;
      if (t) t.value = p.tono;
      if (inx) inx.value = p.intensidad;
    } catch {}
  }

});
