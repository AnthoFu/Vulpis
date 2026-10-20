import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import styles from '../styles/web.styles';
import { getWebGoogleConfig } from '../services/webDrive';

export default function WebDriveModal({
  isOpen,
  onClose,
  onConnectGoogle,
  onConnectToken,
  isLoading,
  errorMessage,
}) {
  const [clientId, setClientId] = useState(() => getWebGoogleConfig().clientId);
  const [manualToken, setManualToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:8081';

  const handleGoogleClick = () => {
    onConnectGoogle(clientId);
  };

  const handleTokenSubmit = () => {
    if (manualToken.trim()) {
      onConnectToken(manualToken);
    }
  };

  const handleCopyOrigin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentOrigin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { maxWidth: 520 }]}>
        {/* Cabecera */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="logo-google" size={24} color="#8B5CF6" />
            <Text style={styles.modalTitle}>Conectar Google Drive</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.actionIconBtn}>
            <Feather name="x" size={20} color="#8E8F9E" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalDescription}>
          Vulpis Web reproduce tus canciones MP3 directamente desde la carpeta <Text style={{ color: '#A78BFA', fontWeight: 'bold' }}>"Vulpis"</Text> de Google Drive con caché en tu navegador.
        </Text>

        {errorMessage && (
          <View style={{ backgroundColor: '#EF444422', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EF444455' }}>
            <Text style={{ color: '#F87171', fontSize: 13, lineHeight: 18 }}>{errorMessage}</Text>
          </View>
        )}

        {/* Botón principal: Iniciar Sesión con Google */}
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            style={[styles.btnPrimary, { flexDirection: 'row', gap: 10 }]}
            onPress={handleGoogleClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.btnText}>Esperando autorización en ventana...</Text>
              </>
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.btnText}>Iniciar Sesión con Google</Text>
              </>
            )}
          </TouchableOpacity>

          {isLoading && (
            <TouchableOpacity
              style={[styles.btnSecondary, { paddingVertical: 8 }]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { color: '#8E8F9E', fontSize: 13 }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Guía rápida para resolver "Error 401: invalid_client / no registered origin" */}
        <View style={{ backgroundColor: '#161826', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#262942', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="information-circle-outline" size={16} color="#A78BFA" />
            <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
              ¿Error 401: no registered origin?
            </Text>
          </View>
          <Text style={{ color: '#8E8F9E', fontSize: 12, lineHeight: 17 }}>
            En Google Cloud Console, el Client ID debe ser de tipo <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>"Aplicación web"</Text> y tener agregado este origen en "Orígenes autorizados de JavaScript":
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F101A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#202336' }}>
            <Text style={{ color: '#22C55E', fontFamily: 'monospace', fontSize: 12 }}>
              {currentOrigin}
            </Text>
            <TouchableOpacity onPress={handleCopyOrigin} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? '#22C55E' : '#8E8F9E'} />
              <Text style={{ color: copied ? '#22C55E' : '#8E8F9E', fontSize: 11 }}>
                {copied ? 'Copiado' : 'Copiar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alternar opciones avanzadas */}
        <TouchableOpacity
          style={{ alignSelf: 'center', marginTop: 2 }}
          onPress={() => setShowAdvanced((prev) => !prev)}
        >
          <Text style={{ color: '#6F738E', fontSize: 13, textDecorationLine: 'underline' }}>
            {showAdvanced ? 'Ocultar opciones avanzadas' : 'Configurar Client ID Web o Token Manual'}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={{ gap: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: '#1F2232', paddingTop: 14 }}>
            {/* Input de Client ID Web */}
            <View>
              <Text style={styles.inputLabel}>Google Client ID para Web (Web Application)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ej. 123456789-xyz.apps.googleusercontent.com"
                placeholderTextColor="#555870"
                value={clientId}
                onChangeText={setClientId}
              />
              <Text style={{ color: '#555870', fontSize: 11, marginTop: 4 }}>
                También puedes definirlo en tu archivo .env como EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
              </Text>
            </View>

            {/* Input de Token Manual */}
            <View>
              <Text style={styles.inputLabel}>O ingresa un Access Token directo (para pruebas)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Bearer ya29.a0..."
                  placeholderTextColor="#555870"
                  value={manualToken}
                  onChangeText={setManualToken}
                />
                <TouchableOpacity
                  style={[styles.btnSecondary, { paddingHorizontal: 16 }]}
                  onPress={handleTokenSubmit}
                  disabled={isLoading || !manualToken.trim()}
                >
                  <Text style={styles.btnText}>Conectar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
