import React, { useRef, useEffect } from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/PlayerCard.styles';

export interface PlayerLiveLyricProps {
  activeLyricLine?: string | null;
  onPress?: () => void;
}

/**
 * Banner interactivo que previsualiza la línea activa de la letra con animación suave de entrada.
 */
export default function PlayerLiveLyric({
  activeLyricLine,
  onPress,
}: PlayerLiveLyricProps): React.JSX.Element | null {
  const lyricFadeAnim = useRef(new Animated.Value(1)).current;
  const prevLyricRef = useRef(activeLyricLine);

  useEffect(() => {
    if (prevLyricRef.current !== activeLyricLine) {
      prevLyricRef.current = activeLyricLine;
      lyricFadeAnim.setValue(0);
      Animated.timing(lyricFadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }).start();
    }
  }, [activeLyricLine, lyricFadeAnim]);

  if (!activeLyricLine) return null;

  return (
    <Animated.View
      style={{
        opacity: lyricFadeAnim,
        transform: [
          {
            translateY: lyricFadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
        width: '100%',
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.liveLyricContainer}
      >
        <MaterialCommunityIcons
          name="microphone-variant"
          size={14}
          color="rgba(167, 139, 250, 0.7)"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.liveLyricText} numberOfLines={1}>
          {activeLyricLine}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
