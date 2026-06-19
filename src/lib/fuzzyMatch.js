// US-15 — Emparejamiento difuso entre una transcripcion y un conjunto de opciones.
//
// Devuelve la opcion mas similar y un score en [0, 1] (1 = exacto).
// Usa distancia de Levenshtein normalizada por la longitud de la cadena mas larga.

const stripDiacritics = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
};

const similarity = (a, b) => {
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a, b) / maxLen;
};

export const findBestOptionMatch = (transcript, options) => {
  if (!Array.isArray(options) || options.length === 0) {
    return { option: null, score: 0 };
  }
  const normalizedTranscript = stripDiacritics(String(transcript || ""));
  if (!normalizedTranscript) {
    return { option: null, score: 0 };
  }

  let best = { option: null, score: 0 };

  options.forEach((option) => {
    const normalizedOption = stripDiacritics(String(option));
    if (!normalizedOption) return;

    let score = similarity(normalizedTranscript, normalizedOption);

    if (normalizedTranscript === normalizedOption) {
      score = 1;
    } else if (
      normalizedTranscript.includes(normalizedOption) ||
      normalizedOption.includes(normalizedTranscript)
    ) {
      score = Math.max(score, 0.9);
    }

    if (score > best.score) {
      best = { option, score: Number(score.toFixed(3)) };
    }
  });

  return best;
};

export const CONFIDENCE_THRESHOLD = 0.7;
