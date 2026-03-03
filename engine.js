export function crearPerfil({ genero, tono, intensidad, protagonista, tema }) {
  return { genero, tono, intensidad, protagonista, tema };
}

export function crearEstadoInicial() {
  return {
    escena: 1,
    salud: 3,
    tension: 0,
    misterio: 0,
    moralidad: 0,
    valor: 0,
    inventario: [],
    memoria: []
  };
}

export function pushMemoria(estado, texto) {
  estado.memoria.push(texto);
  if (estado.memoria.length > 12) estado.memoria.shift();
}

export function resumenMemoriaCorta(estado) {
  const tail = estado.memoria.slice(-3);
  return tail.length ? tail.join(" | ") : "vacía";
}

export function aplicarImpacto(estado, impacto = {}) {
  if (impacto.salud) estado.salud += impacto.salud;
  if (impacto.tension) estado.tension += impacto.tension;
  if (impacto.misterio) estado.misterio += impacto.misterio;
  if (impacto.moralidad) estado.moralidad += impacto.moralidad;
  if (impacto.valor) estado.valor += impacto.valor;

  if (impacto.inventario_add) {
    if (!estado.inventario.includes(impacto.inventario_add)) {
      estado.inventario.push(impacto.inventario_add);
    }
  }

  // clamp básico
  estado.salud = Math.max(0, Math.min(3, estado.salud));
}
