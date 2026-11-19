import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import styles from '../styles/web.styles';

export interface WebNavbarProps {
  isDriveConnected: boolean;
  onOpenDriveModal: () => void;
  onRefreshDrive: () => void;
  onDisconnectDrive: () => void;
  onOpenLocalFiles?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function WebNavbar({
  isDriveConnected,
  onOpenDriveModal,
  onRefreshDrive,
  onDisconnectDrive,
  onOpenLocalFiles,
  searchQuery,
  onSearchChange,
}: WebNavbarProps): React.JSX.Element {
  return (
    <View style={styles.navbar}>
      {/* Marca / Logo */}
      <View style={styles.navBrand}>
        <Image
          source={require('../../../assets/AnthoFu-Icon-Purple.png')}
          style={styles.navLogo}
          resizeMode="contain"
        />
        <Text style={styles.navTitle}>Vulpis</Text>
        <View style={styles.navBadge}>
          <Text style={styles.navBadgeText}>Web</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.navSearchContainer}>
        <Feather name="search" size={16} color="#6F738E" />
        <TextInput
          style={styles.navSearchInput}
          placeholder="Buscar por título o artista..."
          placeholderTextColor="#6F738E"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Feather name="x" size={16} color="#8E8F9E" />
          </TouchableOpacity>
        )}
      </View>

      {/* Acciones y Conexión de Drive */}
      <View style={styles.navActions}>
        {onOpenLocalFiles && (
          <TouchableOpacity
            style={[styles.driveConnectBtn, { backgroundColor: '#161826', borderWidth: 1, borderColor: '#2E324E' }]}
            onPress={onOpenLocalFiles}
          >
            <Feather name="folder-plus" size={15} color="#A78BFA" />
            <Text style={[styles.driveBtnText, { color: '#E2E8F0' }]}>Abrir MP3s</Text>
          </TouchableOpacity>
        )}

        {isDriveConnected ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.driveConnectBtn, styles.driveConnectedBtn, { paddingHorizontal: 10, paddingVertical: 6 }]}>
              <Ionicons name="cloud-done" size={14} color="#22C55E" />
              <Text style={[styles.driveBtnText, { color: '#22C55E', fontSize: 12 }]}>Drive</Text>
            </View>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={onRefreshDrive}
            >
              <Feather name="refresh-cw" size={15} color="#A78BFA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={onDisconnectDrive}
            >
              <Feather name="log-out" size={15} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.driveConnectBtn}
            onPress={onOpenDriveModal}
          >
            <Ionicons name="cloud-outline" size={16} color="#FFFFFF" />
            <Text style={styles.driveBtnText}>Conectar Drive</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
