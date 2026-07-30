import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function useSidebarDrawer({ isOpen }) {
  const [visible, setVisible] = useState(isOpen);
  const slideAnim = useRef(new Animated.Value(-290)).current;
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
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.65,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -290,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
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
