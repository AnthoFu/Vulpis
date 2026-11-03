import React from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../../styles/Header.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlayerContext } from '../../context/PlayerContext';

export interface HeaderProps {
  onMenuPress?: () => void;
  currentSource?: string;
  tracksCount?: number;
  playlistsCount?: number;
  isDriveConnected?: boolean;
  isLoading?: boolean;
}

/**
 * Encabezado superior de la aplicación con título dinámico e indicador de menú.
 * Puede recibir propiedades explícitas o consumir automáticamente el `PlayerContext`.
 */
export default function Header(props: HeaderProps): React.JSX.Element {
  const player = React.useContext(PlayerContext);

  const onMenuPress = props.onMenuPress || (() => player?.setIsDrawerOpen?.(true));
  const currentSource = props.currentSource || player?.currentSource || 'local';
  const isLoading = props.isLoading !== undefined ? props.isLoading : (player?.isSourceChanging || player?.isDriveLoading || false);

  const getHeaderTitle = (): string => {
    switch (currentSource) {
      case 'local':
        return 'Biblioteca';
      case 'private':
        return 'Google Drive';
      case 'playlists':
        return 'Playlists';
      default:
        return 'Vulpis';
    }
  };

  const title = getHeaderTitle();

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.iconButtonPlaceholder}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : (
          <MaterialCommunityIcons name="music-note" size={20} color="#4E4F62" />
        )}
      </View>
    </View>
  );
}
