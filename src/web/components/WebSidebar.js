import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/web.styles';

export default function WebSidebar({
  currentView,
  onSelectView,
  queueCount = 0,
  driveTrackCount = 0,
  onToggleLyrics,
  isLyricsOpen,
}) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarSectionTitle}>Mi Música</Text>

      {/* Pestaña: Canciones de Google Drive */}
      <TouchableOpacity
        style={[
          styles.sidebarItem,
          currentView === 'drive' && styles.sidebarItemActive,
        ]}
        onPress={() => onSelectView('drive')}
      >
        <Feather
          name="cloud"
          size={18}
          color={currentView === 'drive' ? '#A78BFA' : '#8E8F9E'}
        />
        <Text
          style={[
            styles.sidebarItemText,
            currentView === 'drive' && styles.sidebarItemTextActive,
          ]}
        >
          Google Drive ({driveTrackCount})
        </Text>
      </TouchableOpacity>

      {/* Pestaña: Cola de Reproducción */}
      <TouchableOpacity
        style={[
          styles.sidebarItem,
          currentView === 'queue' && styles.sidebarItemActive,
        ]}
        onPress={() => onSelectView('queue')}
      >
        <Feather
          name="list"
          size={18}
          color={currentView === 'queue' ? '#A78BFA' : '#8E8F9E'}
        />
        <Text
          style={[
            styles.sidebarItemText,
            currentView === 'queue' && styles.sidebarItemTextActive,
          ]}
        >
          Cola ({queueCount})
        </Text>
      </TouchableOpacity>

      <Text style={styles.sidebarSectionTitle}>Visualización</Text>

      {/* Letras Sincronizadas */}
      <TouchableOpacity
        style={[
          styles.sidebarItem,
          isLyricsOpen && styles.sidebarItemActive,
        ]}
        onPress={onToggleLyrics}
      >
        <MaterialCommunityIcons
          name="card-text-outline"
          size={18}
          color={isLyricsOpen ? '#A78BFA' : '#8E8F9E'}
        />
        <Text
          style={[
            styles.sidebarItemText,
            isLyricsOpen && styles.sidebarItemTextActive,
          ]}
        >
          Letras Sincronizadas
        </Text>
      </TouchableOpacity>
    </View>
  );
}
