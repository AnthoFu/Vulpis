import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import styles from '../styles/web.styles';
import { getWebGoogleConfig } from '../services/webDrive';

export interface WebDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectGoogle: (clientId?: string) => void;
  onConnectToken: (token: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export default function WebDriveModal({
  isOpen,
  onClose,
  onConnectGoogle,
  onConnectToken,
  isLoading,
  errorMessage,
}: WebDriveModalProps): React.JSX.Element | null {
  const [clientId] = useState<string>(() => getWebGoogleConfig().clientId);
  const [manualToken, setManualToken] = useState<string>('');
  const [showManualToken, setShowManualToken] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGoogleClick = () => {
    onConnectGoogle(clientId);
  };

  const handleTokenSubmit = () => {
    if (manualToken.trim()) {
      onConnectToken(manualToken.trim());
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { maxWidth: 440 }]}>
        {/* Cabecera */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(139, 92, 246, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="cloud-outline" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.modalTitle}>Google Drive</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.actionIconBtn}>
            <Feather name="x" size={18} color="#8E8F9E" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalDescription}>
          Conectá tu cuenta de Google Drive para acceder a tu música en streaming con almacenamiento en caché local en el navegador.
        </Text>

        {errorMessage && (
          <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Text style={{ color: '#F87171', fontSize: 13, lineHeight: 18 }}>{errorMessage}</Text>
          </View>
        )}

        {/* Botón principal */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <TouchableOpacity
            style={[styles.btnPrimary, { flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 12 }]}
            onPress={handleGoogleClick}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.btnText}>Conectando con Google...</Text>
              </>
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.btnText}>Continuar con Google</Text>
              </>
            )}
          </TouchableOpacity>

          {isLoading && (
            <TouchableOpacity
              style={[styles.btnSecondary, { paddingVertical: 8, alignItems: 'center' }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: '#8E8F9E', fontSize: 13 }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Opción discreta para ingresar token manual */}
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity
            style={{ alignSelf: 'center', paddingVertical: 4 }}
            onPress={() => setShowManualToken((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#6F738E', fontSize: 12, textDecorationLine: 'underline' }}>
              {showManualToken ? 'Ocultar token manual' : '¿Preferís ingresar un token de acceso?'}
            </Text>
          </TouchableOpacity>

          {showManualToken && (
            <View style={{ marginTop: 10, gap: 8, backgroundColor: '#131420', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#222538' }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Access Token de Google</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, fontSize: 13 }]}
                  placeholder="Bearer ya29.a0..."
                  placeholderTextColor="#555870"
                  value={manualToken}
                  onChangeText={setManualToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.btnSecondary, { paddingHorizontal: 14, justifyContent: 'center' }]}
                  onPress={handleTokenSubmit}
                  disabled={isLoading || !manualToken.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnText}>Conectar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
