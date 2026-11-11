import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/web.styles';

export interface WebSidebarProps {
  currentView: 'drive' | 'queue' | 'history';
  onSelectView: (view: 'drive' | 'queue' | 'history') => void;
  queueCount?: number;
  driveTrackCount?: number;
  historyCount?: number;
  onToggleLyrics: () => void;
  isLyricsOpen: boolean;
  onToggleEqualizer?: () => void;
  isEqualizerOpen?: boolean;
}

export default function WebSidebar({
  currentView,
  onSelectView,
  queueCount = 0,
  driveTrackCount = 0,
  historyCount = 0,
  onToggleLyrics,
  isLyricsOpen,
  onToggleEqualizer,
  isEqualizerOpen = false,
}: WebSidebarProps): React.JSX.Element {
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

      {/* Pestaña: Historial de Reproducción */}
      <TouchableOpacity
        style={[
          styles.sidebarItem,
          currentView === 'history' && styles.sidebarItemActive,
        ]}
        onPress={() => onSelectView('history')}
      >
        <MaterialCommunityIcons
          name="history"
          size={18}
          color={currentView === 'history' ? '#A78BFA' : '#8E8F9E'}
        />
        <Text
          style={[
            styles.sidebarItemText,
            currentView === 'history' && styles.sidebarItemTextActive,
          ]}
        >
          Historial ({historyCount})
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

      {/* Ecualizador de Audio */}
      {onToggleEqualizer && (
        <TouchableOpacity
          style={[
            styles.sidebarItem,
            isEqualizerOpen && styles.sidebarItemActive,
          ]}
          onPress={onToggleEqualizer}
        >
          <MaterialCommunityIcons
            name="tune-vertical"
            size={18}
            color={isEqualizerOpen ? '#A78BFA' : '#8E8F9E'}
          />
          <Text
            style={[
              styles.sidebarItemText,
              isEqualizerOpen && styles.sidebarItemTextActive,
            ]}
          >
            Ecualizador
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
