import React, { createContext, useContext } from 'react';
import useAppController from '../hooks/useAppController';

/**
 * Contexto global de reproducción y estado de la aplicación Vulpis.
 * Centraliza la comunicación entre el orquestador principal y los componentes visuales.
 */
export const PlayerContext = createContext(null);

/**
 * Proveedor principal del estado de reproducción (`PlayerProvider`).
 * Envuelve el árbol de componentes de la aplicación y suministra todas las capacidades
 * del controlador maestro (`useAppController`).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos que consumirán el contexto.
 */
export function PlayerProvider({ children }) {
  const controller = useAppController();

  return (
    <PlayerContext.Provider value={controller}>
      {children}
    </PlayerContext.Provider>
  );
}

/**
 * Hook personalizado para consumir el estado y acciones del reproductor.
 *
 * @returns {import('../hooks/useAppController').AppControllerResult}
 * @throws {Error} Si se invoca fuera de un `PlayerProvider`.
 */
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer debe utilizarse dentro de un <PlayerProvider />');
  }
  return context;
}
