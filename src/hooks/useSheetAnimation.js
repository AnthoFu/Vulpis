import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  DURATION,
  SPRING,
  BACKDROP_OPACITY,
  SHEET_TRANSLATE_Y_HIDDEN,
} from '../constants/animations';

/**
 * useSheetAnimation — Hook reutilizable para bottom sheets animados
 *
 * Maneja el ciclo completo de un bottom sheet:
 *  1. visible: monta el componente en el DOM
 *  2. translateY: desliza el panel desde la parte inferior
 *  3. opacity: hace fade del backdrop
 *  4. Al cerrar: anima la salida y desmonta el componente al terminar
 *
 * Uso:
 *   const { visible, translateY, backdropOpacity } = useSheetAnimation({ isOpen });
 *   // En JSX: solo renderiza si `visible`, aplica transform al panel y opacity al backdrop
 *
 * @param {boolean} isOpen  — Estado de apertura controlado externamente
 * @param {object}  options — Opciones opcionales de personalización
 */
export default function useSheetAnimation({ isOpen, options = {} }) {
  const {
    enterDuration = DURATION.normal,
    exitDuration  = DURATION.fast,
    spring        = SPRING.gentle,
    useSpringEnter = true,
  } = options;

  const [visible, setVisible] = useState(isOpen);
  const translateY    = useRef(new Animated.Value(SHEET_TRANSLATE_Y_HIDDEN)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Saltar la animación en el primer render si está cerrado
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOpen) return;
    }

    if (isOpen) {
      setVisible(true);

      const enterY = useSpringEnter
        ? Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            ...spring,
          })
        : Animated.timing(translateY, {
            toValue: 0,
            duration: enterDuration,
            useNativeDriver: true,
          });

      Animated.parallel([
        enterY,
        Animated.timing(backdropOpacity, {
          toValue: BACKDROP_OPACITY,
          duration: enterDuration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_TRANSLATE_Y_HIDDEN,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: exitDuration,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [isOpen]);

  return { visible, translateY, backdropOpacity };
}
