import React from 'react';
import { View, Image } from 'react-native';
import styles from '../../styles/PlayerCard.styles';

export interface PlayerArtworkProps {
  artworkUrl?: string;
}

/**
 * Contenedor de la carátula principal con marco de elevación y sombra dinámica.
 */
export default function PlayerArtwork({ artworkUrl }: PlayerArtworkProps): React.JSX.Element {
  return (
    <View style={styles.artworkContainer}>
      <View style={styles.artworkShadowWrapper}>
        <Image
          source={artworkUrl ? { uri: artworkUrl } : undefined}
          style={styles.artwork}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}
