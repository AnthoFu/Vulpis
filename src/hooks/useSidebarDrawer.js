import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  DURATION,
  SPRING,
  BACKDROP_OPACITY,
  DRAWER_TRANSLATE_X_HIDDEN,
} from '../constants/animations';

export default function useSidebarDrawer({ isOpen }) {
  const [visible, setVisible] = useState(isOpen);
  const slideAnim = useRef(new Animated.Value(DRAWER_TRANSLATE_X_HIDDEN)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid running the animation on the initial render if the drawer is closed
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOpen) {
        return;
      }
    }

    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          ...SPRING.gentle,
        }),
        Animated.timing(fadeAnim, {
          toValue: BACKDROP_OPACITY,
          duration: DURATION.normal,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_TRANSLATE_X_HIDDEN,
          duration: DURATION.fast,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: DURATION.fast,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }
  }, [isOpen]);

  return {
    visible,
    slideAnim,
    fadeAnim,
  };
}

