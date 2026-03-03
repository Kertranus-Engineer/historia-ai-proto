// generator.js
import { eventos } from "./events.js";

const POOLS = {
  supervivencia: {
    objetivos: ["encontrar refugio", "conseguir agua limpia", "salir del perímetro"],
    eventos: {
      setup: ["encuentras huellas recientes", "ves humo a lo lejos", "hallazgo: una mochila abandonada"],
      complica: ["tu ruta queda bloqueada", "escuchas pasos siguiéndote", "hallazgo: una navaja oxidada"],
      climax: ["te rodean", "un incendio te corta el paso", "te descubren"],
      resuelve: ["divisas una salida", "encuentras un refugio", "llegas a un camino seguro"]
    },
    amenazas: ["un perro salvaje", "una persona armada", "una caída peligrosa"]
  },

  horror: {
    objetivos: ["romper la maldición", "encontrar la fuente del susurro", "salir antes del anochecer"],
    eventos: {
      setup: ["un susurro repite tu nombre", "una sombra cruza sin ruido", "hallazgo: una vela negra"],
      complica: ["algo raspa desde dentro", "un reflejo no coincide", "hallazgo: sal bendita"],
      climax: ["la figura se acerca", "se apagan los sonidos", "tu miedo se materializa"],
      resuelve: ["la presión baja", "la luz vuelve", "el susurro se aleja"]
    },
    amenazas: ["algo invisible", "una figura inmóvil", "un chillido detrás"]
  },

  "ciencia ficcion": {
    objetivos: ["restablecer la señal", "activar el módulo", "evitar el rastreo"],
    eventos: {
      setup: ["un pitido intermitente guía tu atención", "ves un dron caído", "hallazgo: batería intacta"],
      complica: ["una alarma automática se enciende", "un campo eléctrico bloquea", "hallazgo: llave magnética"],
      climax: ["el sistema te marca", "aparecen drones", "un láser de rastreo te fija"],
      resuelve: ["la señal se estabiliza", "la alarma se apaga", "encuentras un túnel de servicio"]
    },
    amenazas: ["un robot patrulla", "un láser de rastreo", "una alarma automática"]
  },

  fantasia: {
    objetivos: ["hallar el símbolo", "sellar el portal", "recuperar el amuleto"],
    eventos: {
      setup: ["una runa brilla en el suelo", "la niebla forma un rostro", "hallazgo: moneda marcada"],
      complica: ["un guardián te observa", "la magia distorsiona el camino", "hallazgo: polvo de hada"],
      climax: ["un espectro se abalanza", "el portal late", "un hechizo falla y explota"],
      resuelve: ["la runa se apaga", "el portal se estabiliza", "un sendero aparece"]
    },
    amenazas: ["un espectro", "un guardián antiguo", "una bestia"]
  }
};

const OBJETOS = ["llave antigua", "sensor alienígena", "botiquín", "cristal extraño"];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function faseNombre(fase) {
  if (fase === 0) return "setup";
  if (fase === 1) return "complica";
  if (fase === 2) return "climax";
  return "resuelve";
}

function getPool(perfil) {
  const g = (perfil?.genero || "supervivencia").toLowerCase();
  return POOLS[g] || POOLS.supervivencia;
}

function ensureObjetivo(estado, pool) {
  if (!estado.objetivo) estado.objetivo = pick(pool.objetivos);
}

function avanzarFase(estado) {
  // 0-2, 3-6, 7-9, 10+
  if (estado.turno >= 10) estado.fase = 3;
  else if (estado.turno >= 7) estado.fase = 2;
  else if (estado.turno >= 3) estado.fase = 1;
  else estado.fase = 0;
}

function eventoConNoRepetir(estado, pool, faseKey) {
  const opciones = pool.eventos[faseKey];
  if (!opciones?.length) return "pasa algo extraño.";

  estado.flags = estado.flags || {};
  const last = estado.flags.lastEvento || null;

  let e = pick(opciones);
  if (last && e === last && opciones.length > 1) {
    e = pick(opciones.filter(x => x !== last));
  }

  estado.flags.lastEvento = e;
  return e;
}

function parseHallazgo(texto) {
  const prefix = "hallazgo:";
  if (!texto || !texto.toLowerCase().startsWith(prefix)) return null;
  return texto.slice(prefix.length).trim();
}

function pushFlag(estado, texto) {
  estado.flags = estado.flags || {};
  estado.flags.log = estado.flags.log || [];
  estado.flags.log.push(texto);
  if (estado.flags.log.length > 8) estado.flags.log.shift();
}

function eventoGlobalAleatorio(estado) {
  if (!eventos?.length) return null;
  if (Math.random() > 0.5) return null; // 50%

  const e = pick(eventos);
  try {
    if (typeof e.efecto === "function") e.efecto(estado);
  } catch {}

  return e.texto || null;
}

function recortar(arr, max) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, max);
}

function opcionesBase({ estado, perfil, riesgo }) {
  const ops = [];

  ops.push({
    texto: "Investigar",
    impacto: { misterio: +1, tension: +riesgo },
    efecto: (s) => {
      s.flags = s.flags || {};
      s.inventario = s.inventario || [];

      const last = s.flags.lastEvento || "";
      const itemHallazgo = parseHallazgo(last);

      if (itemHallazgo && !s.inventario.includes(itemHallazgo)) {
        s.inventario.push(itemHallazgo);
        pushFlag(s, `Obtuviste: ${itemHallazgo}`);
      } else {
        if (Math.random() < 0.35) {
          const obj = pick(OBJETOS);
          if (!s.inventario.includes(obj)) {
            s.inventario.push(obj);
            pushFlag(s, `Obtuviste: ${obj}`);
          }
        }
      }
    }
  });

  ops.push({
    texto: "Moverte con cuidado",
    impacto: { tension: -1 }
  });

  ops.push({
    texto: "Actuar con valentía",
    impacto: { valor: +1, tension: +1, salud: riesgo ? -1 : 0 }
  });

  // Condicionales inventario
  if ((estado.inventario || []).includes("botiquín")) {
    ops.push({
      texto: "Usar botiquín",
      impacto: { salud: +1, tension: -1 },
      consume: "botiquín"
    });
  }

  if ((estado.inventario || []).includes("sensor alienígena")) {
    ops.push({
      texto: "Escanear el entorno",
      impacto: { misterio: +2, tension: +1 },
      flagSet: "escaneo"
    });
  }

  if ((estado.inventario || []).includes("llave antigua") || (estado.inventario || []).includes("llave magnética")) {
    ops.push({
      texto: "Forzar una puerta con la llave",
      impacto: { misterio: +1, valor: +1, tension: -1 },
      flagSet: "puerta_abierta"
    });
  }

  if (perfil.tono === "comico") {
    ops.push({
      texto: "Hacerte el chistoso para calmarte",
      impacto: { tension: -1, moralidad: +1 }
    });
  }

  return recortar(ops, 4);
}

export function generarEscena({ estado, perfil, datosUsuario }) {
  const pool = getPool(perfil);

  estado.flags = estado.flags || {};
  estado.inventario = estado.inventario || [];
  ensureObjetivo(estado, pool);

  estado.turno = (estado.turno ?? 0) + 1;
  avanzarFase(estado);

  const faseKey = faseNombre(estado.fase);

  const i = Number(perfil.intensidad ?? 6);
  const riesgo = i >= 8 ? 2 : i <= 3 ? 0 : 1;

  const amenaza = pick(pool.amenazas);
  const eventoLocal = eventoConNoRepetir(estado, pool, faseKey);

  const eventoGlobal = eventoGlobalAleatorio(estado);

  const memoria = estado.memoria?.slice(-2).join(" | ") || "vacía";
  const logFlags = (estado.flags?.log || []).slice(-2).join(" | ");

  const lugar = (datosUsuario?.lugar || "un lugar desconocido").trim();
  const miedo = (datosUsuario?.miedo || "algo").trim();
  const deseo = (datosUsuario?.deseo || "seguir").trim();

  let texto =
`${perfil.tono === "oscuro" ? "La luz parece enferma.\n" : ""}Estás en ${lugar}. Objetivo: ${estado.objetivo}.
Fase: ${faseKey.toUpperCase()}.

Ocurre: ${eventoLocal}.
Sientes que ${amenaza} está cerca.
Tu miedo (${miedo}) aparece, pero piensas en ${deseo}.`;

  if (eventoGlobal) {
    texto += `\n\nEVENTO EXTRA: ${eventoGlobal}.`;
    pushFlag(estado, `Evento extra: ${eventoGlobal}`);
  }

  texto += `

Estado: salud=${estado.salud}, tension=${estado.tension}, misterio=${estado.misterio}, valor=${estado.valor}
Inventario: ${(estado.inventario || []).join(", ") || "vacío"}
Flags: ${logFlags || "ninguna"}
Memoria: ${memoria}`;

  let opciones = opcionesBase({ estado, perfil, riesgo });

  // normaliza impactos
  opciones.forEach(o => {
    o.impacto = o.impacto || {};
    if (o.impacto.tension != null) o.impacto.tension = clamp(o.impacto.tension, -3, +3);
    if (o.impacto.salud != null) o.impacto.salud = clamp(o.impacto.salud, -2, +1);
    if (o.impacto.misterio != null) o.impact
