import React, { useRef } from 'react';
import {
  View,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import styles from '../../styles/PlayerCard.styles';
import { SPRING, DURATION } from '../../constants/animations';

export interface PlayerArtworkProps {
  artworkUrl?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onSwipeDown?: (dy: number) => void;
  onSwipeDownRelease?: (dy: number, vy: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.35;

/**
 * Contenedor interactivo de la carátula principal con soporte para:
 * - Deslizamiento horizontal (Swipe Left / Swipe Right) para cambiar de pista.
 * - Deslizamiento vertical hacia abajo (Swipe Down) para minimizar PlayerCard.
 */
export default function PlayerArtwork({
  artworkUrl,
  onNext,
  onPrevious,
  onSwipeDown,
  onSwipeDownRelease,
}: PlayerArtworkProps): React.JSX.Element {
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detectar si el usuario inicia un desplazamiento intencionado
        const isHorizontal = Math.abs(gestureState.dx) > 10;
        const isVerticalDown = gestureState.dy > 10;
        return isHorizontal || isVerticalDown;
      },
      onPanResponderGrant: () => {
        gestureDirectionRef.current = null;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;

        // Fijar dirección predominante del gesto
        if (!gestureDirectionRef.current) {
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
            gestureDirectionRef.current = 'horizontal';
          } else if (dy > 8 && dy > Math.abs(dx)) {
            gestureDirectionRef.current = 'vertical';
          }
        }

        if (gestureDirectionRef.current === 'horizontal') {
          translateX.setValue(dx);
        } else if (gestureDirectionRef.current === 'vertical') {
          if (dy > 0) {
            onSwipeDown?.(dy);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;

        if (gestureDirectionRef.current === 'horizontal') {
          const isSwipeLeft = dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD;
          const isSwipeRight = dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD;

          if (isSwipeLeft) {
            // Deslizar hacia la izquierda -> Siguiente pista
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: DURATION.fast,
              useNativeDriver: true,
            }).start(() => {
              onNext?.();
              // Entrada suave de la nueva portada desde la derecha
              translateX.setValue(SCREEN_WIDTH * 0.7);
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                ...SPRING.gentle,
              }).start();
            });
          } else if (isSwipeRight) {
            // Deslizar hacia la derecha -> Pista anterior
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH,
              duration: DURATION.fast,
              useNativeDriver: true,
            }).start(() => {
              onPrevious?.();
              // Entrada suave de la nueva portada desde la izquierda
              translateX.setValue(-SCREEN_WIDTH * 0.7);
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                ...SPRING.gentle,
              }).start();
            });
          } else {
            // No alcanzó el umbral -> Retorno elástico al centro
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              ...SPRING.gentle,
            }).start();
          }
        } else if (gestureDirectionRef.current === 'vertical') {
          onSwipeDownRelease?.(dy, vy);
        }

        gestureDirectionRef.current = null;
      },
      onPanResponderTerminate: () => {
        if (gestureDirectionRef.current === 'horizontal') {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            ...SPRING.gentle,
          }).start();
        } else if (gestureDirectionRef.current === 'vertical') {
          onSwipeDownRelease?.(0, 0);
        }
        gestureDirectionRef.current = null;
      },
    })
  ).current;

  // Interpolación de rotación sutil dinámica tipo vinilo
  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  // Interpolación de opacidad
  const opacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.7, 0, SCREEN_WIDTH * 0.7],
    outputRange: [0.65, 1, 0.65],
    extrapolate: 'clamp',
  });

  // Interpolación de escala ligera al arrastrar
  const scale = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.7, 0, SCREEN_WIDTH * 0.7],
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.artworkContainer} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.artworkShadowWrapper,
          {
            transform: [{ translateX }, { rotate }, { scale }],
            opacity,
          },
        ]}
      >
        <Image
          source={artworkUrl ? { uri: artworkUrl } : undefined}
          style={styles.artwork}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}
