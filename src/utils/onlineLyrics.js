/**
 * Adaptador de compatibilidad heredada: re-exporta desde `src/services/lyrics/lyricsService.js`.
 * @deprecated Utilizar `import { ... } from '../services/lyrics/lyricsService'` o `'../services'`.
 */

export * from '../services/lyrics/lyricsService';
export {
  cleanTitleOnly,
  cleanString,
  calculateSimilarity,
  calculateTitleSimilarity,
} from './fuzzyMatch';
