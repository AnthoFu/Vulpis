import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';

/**
 * Panel de estado y conexión para Google Drive (Nube Privada).
 */
export default function GoogleDrivePanel({
  isDriveConnected,
  isDriveLoading,
  isLoading,
  googleClientId,
  googleRedirectUri,
  onUploadTrackToDrive,
  onRefreshDrive,
  onDisconnectDrive,
  onConnectDrive,
}) {
  if (isDriveConnected) {
    return (
      <View style={styles.driveHeaderBanner}>
        <View style={styles.driveStatusCol}>
          <View style={styles.driveStatusIndicator}>
            <MaterialCommunityIcons name="google-drive" size={20} color="#A78BFA" />
            <Text style={styles.driveStatusText}>Conectado a Google Drive</Text>
          </View>
          <Text style={styles.driveInfoText}>Listo para transmitir canciones</Text>
        </View>
        <View style={styles.driveActionsCol}>
          {onUploadTrackToDrive && (
            <TouchableOpacity
              onPress={onUploadTrackToDrive}
              disabled={isDriveLoading || isLoading}
              style={[styles.driveActionBtn, styles.driveUploadBtn]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cloud-upload" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onRefreshDrive}
            disabled={isDriveLoading || isLoading}
            style={[styles.driveActionBtn, styles.driveRefreshBtn]}
            activeOpacity={0.7}
          >
            {isDriveLoading || isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDisconnectDrive}
            disabled={isDriveLoading || isLoading}
            style={[styles.driveActionBtn, styles.driveDisconnectBtn]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isConfigured = googleClientId && !googleClientId.startsWith('YOUR_GOOGLE_CLIENT_ID');

  return (
    <View style={styles.driveConnectCard}>
      <View style={styles.driveCardHeader}>
        <View style={styles.driveIconWrapper}>
          <MaterialCommunityIcons name="google-drive" size={32} color="#8B5CF6" />
        </View>
        <View style={styles.driveCardTitleCol}>
          <Text style={styles.driveCardTitle}>Nube Privada</Text>
          <Text style={styles.driveCardSubtitle}>Transmite tu música desde Google Drive</Text>
        </View>
      </View>

      <Text style={styles.driveDescriptionText}>
        Conecta tu cuenta para sincronizar y transmitir directamente tus archivos de audio (.mp3) guardados en Google Drive. Tus datos y archivos se manejan con total privacidad.
      </Text>

      {!isConfigured && (
        <View style={styles.devWarningBox}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color="#F59E0B"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.devWarningText}>
            <Text style={{ fontWeight: '700' }}>Desarrollador:</Text> Configura tu Client ID real en el archivo{' '}
            <Text style={{ fontFamily: 'monospace', color: '#A78BFA' }}>src/constants/config.js</Text> para habilitar la conexión.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.driveConnectBtn,
          (!isConfigured || isDriveLoading) && styles.driveConnectBtnDisabled,
        ]}
        disabled={!isConfigured || isDriveLoading}
        onPress={() => onConnectDrive && onConnectDrive(googleClientId, googleRedirectUri)}
        activeOpacity={0.8}
      >
        {isDriveLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialCommunityIcons name="google-drive" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.driveConnectBtnText}>Conectar Google Drive</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
