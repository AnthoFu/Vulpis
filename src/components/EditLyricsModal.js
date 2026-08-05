import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/EditLyricsModal.styles';

export default function EditLyricsModal({
  visible,
  onClose,
  initialLyrics,
  trackTitle,
  trackArtist,
  onSave,
  onReset,
  onFetchOnline,
}) {
  const [lyricsInput, setLyricsInput] = useState('');
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  useEffect(() => {
    if (visible) {
      setLyricsInput(initialLyrics || '');
    }
  }, [visible, initialLyrics]);

  const handleSave = () => {
    const trimmed = lyricsInput.trim();
    if (!trimmed) {
      Alert.alert(
        'Letra Vacía',
        '¿Deseas eliminar la letra de esta canción o restablecerla a la original?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restablecer Original',
            style: 'destructive',
            onPress: () => {
              if (onReset) onReset();
              onClose();
            },
          },
        ]
      );
      return;
    }

    if (onSave) {
      onSave(trimmed);
    }
    onClose();
  };

  const handleReset = () => {
    Alert.alert(
      'Restablecer Letra',
      '¿Deseas eliminar tu letra personalizada y restaurar la letra por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            if (onReset) onReset();
            onClose();
          },
        },
      ]
    );
  };

  const handleFetchFromApi = async () => {
    if (!onFetchOnline) return;
    setIsSearchingApi(true);
    const success = await onFetchOnline();
    setIsSearchingApi(false);
    if (success) {
      Alert.alert('¡Éxito!', 'Se obtuvo y reemplazó la letra desde la API pública.');
    } else {
      Alert.alert('Sin Coincidencias', 'No se encontró una letra adecuada en la API para esta canción.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                {/* Encabezado */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <MaterialCommunityIcons name="pencil-box-outline" size={24} color="#8B5CF6" />
                    <View style={styles.headerTextCol}>
                      <Text style={styles.title}>Editar / Reemplazar Letra</Text>
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {trackTitle} • {trackArtist}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Botón para forzar reemplazo desde la API */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(139, 92, 246, 0.25)',
                    marginBottom: 14,
                  }}
                  onPress={handleFetchFromApi}
                  disabled={isSearchingApi}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cloud-sync-outline" size={18} color="#A78BFA" />
                  <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '700' }}>
                    {isSearchingApi ? 'Buscando en la API...' : 'Reemplazar con letra de la API (LRCLIB)'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>
                  Escribe o pega la letra (soporta texto plano o formato sincronizado .lrc):
                </Text>

                <TextInput
                  style={styles.textInput}
                  multiline={true}
                  value={lyricsInput}
                  onChangeText={setLyricsInput}
                  placeholder="[00:12.00] Tu letra aquí..."
                  placeholderTextColor="#475569"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />

                <View style={styles.infoFooter}>
                  <MaterialCommunityIcons name="information-outline" size={14} color="#64748B" />
                  <Text style={styles.infoText}>
                    Esta letra reemplazará la de por defecto y se guardará localmente para esta canción.
                  </Text>
                </View>

                {/* Acciones */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="refresh" size={18} color="#94A3B8" />
                    <Text style={styles.secondaryButtonText}>Restablecer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Guardar Letra</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
