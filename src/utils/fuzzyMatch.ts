/**
 * Utilidades para cálculo de similitud difusa (Fuzzy Matching) de títulos y artistas.
 * Emplea el algoritmo del Coeficiente de Sørensen-Dice sobre bigramas de caracteres.
 */

/**
 * Limpia el título quitando extensiones de archivo, etiquetas de descargas,
 * colaboraciones (feat/ft) y corchetes de metadatos no musicales.
 *
 * @param str Cadena de texto de entrada
 * @returns Cadena limpia y normalizada en minúsculas
 */
export function cleanTitleOnly(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\.(mp3|flac|m4a|wav|aac|ogg|opus)$/i, '')
    // Eliminar etiquetas de colaboraciones entre paréntesis o corchetes: (feat. ...), [ft. ...]
    .replace(/\((feat|ft|featuring|with)[^)]*\)/gi, '')
    .replace(/\[(feat|ft|featuring|with)[^\]]*\]/gi, '')
    .replace(/(feat|ft|featuring)\.?\s+[\w\s]+/gi, '')
    // Eliminar etiquetas de calidad y tipo de video
    .replace(
      /\[(official|audio|video|lyric|hd|remastered|4k|version|live|cover completo|mp3_\d+k)[^\]]*\]/gi,
      ''
    )
    .replace(
      /\((official|audio|video|lyric|hd|remastered|4k|version|live|cover completo|mp3_\d+k)[^)]*\)/gi,
      ''
    )
    .replace(/mp3_\d+k/gi, '')
    .replace(/karaoke de/gi, '')
    .replace(/cover completo/gi, '')
    // Eliminar caracteres especiales manteniendo letras con tildes y espacios
    .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Alias de cleanTitleOnly para compatibilidad con módulos consumidores.
 */
export function cleanString(str?: string | null): string {
  return cleanTitleOnly(str);
}

/**
 * Algoritmo de Coeficiente de Sørensen-Dice para calcular la similitud entre 2 cadenas.
 * Retorna un número flotante entre 0.0 (0%) y 1.0 (100%).
 *
 * @param str1 Primera cadena
 * @param str2 Segunda cadena
 * @returns Coeficiente de Sørensen-Dice de 0.0 a 1.0
 */
export function calculateSimilarity(str1?: string | null, str2?: string | null): number {
  const s1 = cleanTitleOnly(str1);
  const s2 = cleanTitleOnly(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.length < 2 || s2.length < 2) {
    return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0.0;
  }

  const getBigrams = (text: string): Map<string, number> => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text.substring(i, i + 2);
      const count = bigrams.get(bigram) || 0;
      bigrams.set(bigram, count + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const [bigram, count1] of bigrams1.entries()) {
    const count2 = bigrams2.get(bigram) || 0;
    intersection += Math.min(count1, count2);
  }

  const totalBigrams = s1.length - 1 + (s2.length - 1);
  return (2.0 * intersection) / totalBigrams;
}

/**
 * Calcula similitud avanzada de títulos considerando subcadenas y títulos truncados.
 *
 * @param str1 Primer título
 * @param str2 Segundo título
 * @returns Coeficiente de similitud ajustado (0.0 a 1.0)
 */
export function calculateTitleSimilarity(str1?: string | null, str2?: string | null): number {
  const s1 = cleanTitleOnly(str1);
  const s2 = cleanTitleOnly(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const bigramSim = calculateSimilarity(s1, s2);

  // Si un título está contenido dentro del otro (ej: "me enamoré de alguien" dentro de "me enamoré de alguien que también")
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    const ratio = minLen / maxLen;
    // Otorgar un valor mínimo de 0.88 a títulos truncados/parciales relevantes
    if (ratio >= 0.4) {
      return Math.max(bigramSim, 0.88);
    }
  }

  return bigramSim;
}
