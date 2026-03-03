// ===== ENGINE v1: Perfil + Estado + Memoria + Validación básica =====

// ---- Perfil de usuario (preferencias) ----
export function crearPerfil(inputs) {
  // inputs puede venir incompleto; ponemos defaults
  return {
    genero: inputs.genero || "supervivencia",       // horror, sci-fi, drama, fantasia, etc.
    tono: inputs.tono || "tenso",                  // tenso, oscuro, esperanzador, comico
    intensidad: clamp(1, inputs.intensidad ?? 6, 10), // 1..10
    protagonista: inputs.protagonista || "normal", // antihéroe, héroe, detective, etc.
    tema: inputs.tema || "supervivencia",          // redención, poder, amor, misterio
    realismo: inputs.realismo ?? "medio",          // bajo/medio/alto
  };
}

// ---- Estado del juego (lo que cambia) ----
export function crearEstadoInicial() {
  return {
    escena: 1,
    salud: 3,         // 0..3
    tension: 0,       // 0..?
    misterio: 0,      // 0..?
    moralidad: 0,     // -5..+5 (por ejemplo)
    valor: 0,
    inventario: [],
    relaciones: {},   // { npcId: score }
    memoriaCorta: [], // últimos eventos (max 5)
    memoriaLarga: "Inicio: despertaste sin entender cómo llegaste aquí.", // resumen acumulado
    seed: Math.floor(Math.random() * 1e9)
  };
}

// ---- Memoria ----
export function pushMemoria(estado, evento) {
  estado.memoriaCorta.push(evento);
  if (estado.memoriaCorta.length > 5) estado.memoriaCorta.shift();
}

export function resumenMemoriaCorta(estado) {
  if (!estado.memoriaCorta.length) return "Sin eventos relevantes aún.";
  return estado.memoriaCorta.join(" • ");
}

// ---- Aplicar impactos de una opción ----
// impacto ejemplo: { tension:+1, salud:-1, inventario_add:"llave" }
export function aplicarImpacto(estado, impacto = {}) {
  if (typeof impacto.salud === "number") estado.salud = clamp(0, estado.salud + impacto.salud, 3);
  if (typeof impacto.tension === "number") estado.tension = Math.max(0, estado.tension + impacto.tension);
  if (typeof impacto.misterio === "number") estado.misterio = Math.max(0, estado.misterio + impacto.misterio);
  if (typeof impacto.moralidad === "number") estado.moralidad = clamp(-5, estado.moralidad + impacto.moralidad, 5);
  if (typeof impacto.valor === "number") estado.valor = Math.max(0, estado.valor + impacto.valor);

  if (impacto.inventario_add) {
    if (!estado.inventario.includes(impacto.inventario_add)) {
      estado.inventario.push(impacto.inventario_add);
    }
  }
  if (impacto.inventario_remove) {
    estado.inventario = estado.inventario.filter(x => x !== impacto.inventario_remove);
  }

  if (impacto.relacion && impacto.relacion.npcId) {
    const { npcId, delta } = impacto.relacion;
    estado.relaciones[npcId] = (estado.relaciones[npcId] || 0) + (delta || 0);
  }
}

// ---- Validación básica de escena (para IA real después) ----
export function validarEscena(escenaObj) {
  const errors = [];
  if (!escenaObj || typeof escenaObj !== "object") errors.push("Escena no es objeto.");
  if (!escenaObj.texto || typeof escenaObj.texto !== "string") errors.push("Falta texto.");
  if (!Array.isArray(escenaObj.opciones) || escenaObj.opciones.length < 2) errors.push("Opciones inválidas.");
  for (const op of (escenaObj.opciones || [])) {
    if (!op.texto) errors.push("Opción sin texto.");
    if (typeof op.go !== "number") errors.push("Opción sin 'go' numérico.");
    if (op.impacto && typeof op.impacto !== "object") errors.push("Impacto inválido.");
  }
  return errors;
}

// ---- Helpers ----
function clamp(min, v, max) {
  return Math.max(min, Math.min(v, max));
}