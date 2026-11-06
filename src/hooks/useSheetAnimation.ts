import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  DURATION,
  SPRING,
  BACKDROP_OPACITY,
  SHEET_TRANSLATE_Y_HIDDEN,
} from '../constants/animations';

export interface SheetAnimationOptions {
  enterDuration?: number;
  exitDuration?: number;
  spring?: typeof SPRING.gentle;
  useSpringEnter?: boolean;
}

export interface UseSheetAnimationParams {
  isOpen: boolean;
  options?: SheetAnimationOptions;
}

export interface UseSheetAnimationReturn {
  visible: boolean;
  translateY: Animated.Value;
  backdropOpacity: Animated.Value;
}

/**
 * useSheetAnimation — Hook reutilizable para bottom sheets animados
 */
export default function useSheetAnimation({
  isOpen,
  options = {},
}: UseSheetAnimationParams): UseSheetAnimationReturn {
  const {
    enterDuration = DURATION.normal,
    exitDuration = DURATION.fast,
    spring = SPRING.gentle,
    useSpringEnter = true,
  } = options;

  const [visible, setVisible] = useState(isOpen);
  const translateY = useRef(new Animated.Value(SHEET_TRANSLATE_Y_HIDDEN)).current;
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
