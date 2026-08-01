import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import styles from '../styles/Header.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ 
  onMenuPress, 
  currentSource,
  tracksCount = 0,
  playlistsCount = 0,
  isDriveConnected = false 
}) {
  const getHeaderInfo = () => {
    switch (currentSource) {
      case 'local':
        return {
          title: 'Biblioteca',
          subtitle: `${tracksCount} CANCIONES`
        };
      case 'private':
        return {
          title: 'Google Drive',
          subtitle: isDriveConnected ? `${tracksCount} PISTAS EN LA NUBE` : 'DESCONECTADO'
        };
      case 'playlists':
        return {
          title: 'Playlists',
          subtitle: `${playlistsCount} LISTAS CREADAS`
        };
      default:
        return {
          title: 'Vulpis',
          subtitle: 'NUBE DE AUDIO HÍBRIDA'
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.iconButtonPlaceholder}>
        <MaterialCommunityIcons name="cloud-sync-outline" size={22} color="#8B5CF6" />
      </View>
    </View>
  );
}


