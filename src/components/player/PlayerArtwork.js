import React from 'react';
import { View, Image } from 'react-native';
import styles from '../../styles/PlayerCard.styles';

/**
 * Contenedor de la carátula principal con marco de elevación y sombra dinámica.
 *
 * @param {Object} props
 * @param {string} props.artworkUrl - URI local o remota de la portada a mostrar.
 */
export default function PlayerArtwork({ artworkUrl }) {
  return (
    <View style={styles.artworkContainer}>
      <View style={styles.artworkShadowWrapper}>
        <Image
          source={{ uri: artworkUrl }}
          style={styles.artwork}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}
