// generator.js
const POOLS = {
  supervivencia: {
    eventos: [
      "encuentras agua turbia",
      "ves humo a lo lejos",
      "escuchas ramas romperse",
      "una puerta bloqueada te frena",
      "hallazgo: una mochila abandonada"
    ],
    amenazas: ["un perro salvaje", "una persona armada", "un incendio cercano", "una caída peligrosa"]
  },
  horror: {
    eventos: [
      "una sombra cruza sin hacer ruido",
      "un susurro repite tu nombre",
      "un olor podrido aparece de golpe",
      "algo raspa por dentro de una pared",
      "hallazgo: una foto tuya que no recuerdas"
    ],
    amenazas: ["algo invisible", "una figura inmóvil", "un chillido detrás", "un reflejo que no coincide"]
  },
  "ciencia ficcion": {
    eventos: [
      "un pitido intermitente guía tu atención",
      "ves un dron caído aún encendido",
      "una pantalla muestra símbolos",
      "tu sombra se duplica por un segundo",
      "hallazgo: un módulo con puerto extraño"
    ],
    amenazas: ["un láser de rastreo", "un campo eléctrico", "un robot patrulla", "una alarma automática"]
  },
  fantasia: {
    eventos: [
      "una runa brilla en el suelo",
      "la niebla forma un rostro",
      "un cuervo habla en susurros",
      "una linterna se enciende sola",
      "hallazgo: una moneda marcada"
    ],
    amenazas: ["un espectro", "una bestia", "un hechizo fallido", "un guardián antiguo"]
  }
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function generarEscena({ estado, perfil, datosUsuario }) {
  const genero = perfil.genero || "supervivencia";
  const pool = POOLS[genero] || POOLS.supervivencia;

  const evento = pick(pool.eventos);
  const amenaza = pick(pool.amenazas);

  // intensidad afecta riesgo
  const i = Number(perfil.intensidad ?? 6);
  const riesgo = i >= 8 ? 2 : i <= 3 ? 0 : 1;

  // usa memoria para continuidad ligera
  const memoria = estado.memoria?.slice(-2).join(" | ") || "vacía";

  const texto =
`${perfil.tono === "comico" ? "Ok, esto es ridículo, pero..." : ""}
Estás en ${datosUsuario.lugar}.
Ocurre algo: ${evento}.
Sientes que ${amenaza} podría estar cerca.
Tu miedo (${datosUsuario.miedo}) asoma, pero piensas en ${datosUsuario.deseo}.

Estado: salud=${estado.salud}, tension=${estado.tension}, misterio=${estado.misterio}, valor=${estado.valor}
Memoria: ${memoria}`;

  // Opciones coherentes
  const opciones = [
    {
      texto: "Investigar",
      impacto: { misterio: +1, tension: +riesgo }
    },
    {
      texto: "Moverte con cuidado",
      impacto: { tension: -1 }
    },
    {
      texto: "Actuar con valentía",
      impacto: { valor: +1, tension: +1, salud: riesgo ? -1 : 0 }
    }
  ];

  // Ajustes/clamps post
  opciones.forEach(o => {
    if (o.impacto.tension != null) o.impacto.tension = clamp(o.impacto.tension, -2, +3);
    if (o.impacto.salud != null) o.impacto.salud = clamp(o.impacto.salud, -2, +1);
  });

  return { texto, opciones };
}
