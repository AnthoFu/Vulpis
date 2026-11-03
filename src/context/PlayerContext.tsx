import React, { createContext, useContext, ReactNode } from 'react';
import useAppController, { AppControllerResult } from '../hooks/useAppController';

/**
 * Contexto global de reproducción y estado de la aplicación Vulpis.
 * Centraliza la comunicación entre el orquestador principal y los componentes visuales.
 */
export const PlayerContext = createContext<AppControllerResult | null>(null);

export interface PlayerProviderProps {
  children: ReactNode;
}

/**
 * Proveedor principal del estado de reproducción (`PlayerProvider`).
 * Envuelve el árbol de componentes de la aplicación y suministra todas las capacidades
 * del controlador maestro (`useAppController`).
 */
export function PlayerProvider({ children }: PlayerProviderProps): React.JSX.Element {
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
 * @returns El objeto de estado y controladores AppControllerResult
 * @throws Error si se invoca fuera de un PlayerProvider
 */
export function usePlayer(): AppControllerResult {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer debe utilizarse dentro de un <PlayerProvider />');
  }
  return context;
}
