import React from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../styles/Header.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ 
  onMenuPress, 
  currentSource,
  tracksCount = 0,
  playlistsCount = 0,
  isDriveConnected = false,
  isLoading = false
}) {
  const getHeaderTitle = () => {
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
