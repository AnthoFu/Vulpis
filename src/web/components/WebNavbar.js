import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import styles from '../styles/web.styles';

export default function WebNavbar({
  isDriveConnected,
  onOpenDriveModal,
  onRefreshDrive,
  onDisconnectDrive,
  searchQuery,
  onSearchChange,
}) {
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
        {isDriveConnected ? (
          <>
            <TouchableOpacity
              style={[styles.driveConnectBtn, styles.driveConnectedBtn]}
              onPress={onRefreshDrive}
              title="Actualizar biblioteca de Drive"
            >
              <Ionicons name="cloud-done-outline" size={16} color="#22C55E" />
              <Text style={[styles.driveBtnText, { color: '#22C55E' }]}>Drive Conectado</Text>
              <Feather name="refresh-cw" size={14} color="#8E8F9E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={onDisconnectDrive}
              title="Desconectar Drive"
            >
              <Feather name="log-out" size={18} color="#EF4444" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.driveConnectBtn}
            onPress={onOpenDriveModal}
          >
            <Ionicons name="logo-google" size={16} color="#FFFFFF" />
            <Text style={styles.driveBtnText}>Conectar Google Drive</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
