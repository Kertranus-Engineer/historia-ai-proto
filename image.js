// image.js
const KEY_IMG = "historiaAI_imgCache_v1";

function loadCache() {
  try { return JSON.parse(localStorage.getItem(KEY_IMG) || "{}"); }
  catch { return {}; }
}

function saveCache(cache) {
  localStorage.setItem(KEY_IMG, JSON.stringify(cache));
}

export function hashScene(meta, texto) {
  // hash simple determinista
  const s = JSON.stringify(meta || {}) + "|" + (texto || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(h);
}

export function buildPrompt({ perfil, datosUsuario, meta }) {
  const genero = perfil?.genero || "supervivencia";
  const tono = perfil?.tono || "tenso";

  // Prompt “visual” estándar (en español). Después lo traducimos si quieres.
  return [
    `Ilustración estilo novela gráfica, alta calidad.`,
    `Género: ${genero}. Tono: ${tono}.`,
    `Escena: ${meta?.faseKey || ""}.`,
    `Lugar: ${datosUsuario?.lugar || "desconocido"}.`,
    `Amenaza: ${meta?.amenaza || "desconocida"}.`,
    `Evento: ${meta?.evento || "algo ocurre"}.`,
    `Luz cinematográfica, composición centrada, sin texto en la imagen.`,
  ].join(" ");
}

export function getCachedImage(sceneId) {
  const cache = loadCache();
  return cache[sceneId] || null;
}

export function setCachedImage(sceneId, dataUrlOrUrl) {
  const cache = loadCache();
  cache[sceneId] = dataUrlOrUrl; // por ahora puede ser URL o dataURL
  saveCache(cache);
}
