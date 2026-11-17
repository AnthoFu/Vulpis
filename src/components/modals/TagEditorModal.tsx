import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/TagEditorModal.styles';
import { Track } from '../../models/Track';
import { cleanTrackTitle } from '../../utils/tagEditor';

export interface TagEditorModalProps {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
  onSaveTags: (
    track: Track,
    newTags: { title: string; artist: string; album: string; genre: string }
  ) => Promise<boolean>;
}

const COMMON_GENRES = [
  'Rock',
  'Pop',
  'Metal',
  'Electronic',
  'Hip-Hop',
  'Latin',
  'Acoustic',
  'Jazz',
  'Classical',
  'R&B',
  'Reggae',
  'Folk',
];

/**
 * Modal interactivo para edición de etiquetas y metadatos (ID3) de pistas de audio.
 */
export default function TagEditorModal({
  visible,
  track,
  onClose,
  onSaveTags,
}: TagEditorModalProps): React.JSX.Element | null {
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [album, setAlbum] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (visible && track) {
      setTitle(track.title || '');
      setArtist(track.artist && track.artist !== 'Desconocido' ? track.artist : '');
      setAlbum(
        track.album &&
          track.album !== 'Álbum Desconocido' &&
          track.album !== 'Desconocido'
          ? track.album
          : ''
      );
      setGenre(track.genre || '');
    }
  }, [visible, track]);

  const handleCleanTitle = () => {
    setTitle((prev) => cleanTrackTitle(prev));
  };

  const handleSwapTitleArtist = () => {
    const tempTitle = title;
    setTitle(artist);
    setArtist(tempTitle);
  };

  const handleSelectGenreChip = (selectedGenre: string) => {
    if (genre.toLowerCase() === selectedGenre.toLowerCase()) {
      setGenre('');
    } else {
      setGenre(selectedGenre);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim() || 'Desconocido';
    const trimmedAlbum = album.trim();
    const trimmedGenre = genre.trim();

    if (!trimmedTitle) {
      Alert.alert('Título Requerido', 'La canción debe tener al menos un título válido.');
      return;
    }

    if (!track) return;

    setIsSaving(true);
    try {
      const success = await onSaveTags(track, {
        title: trimmedTitle,
        artist: trimmedArtist,
        album: trimmedAlbum,
        genre: trimmedGenre,
      });

      if (success) {
        onClose();
      }
    } catch (e) {
      console.error('[TagEditorModal] Error al guardar etiquetas:', e);
      Alert.alert('Error', 'No se pudieron guardar las etiquetas de la canción.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible || !track) return null;

  const isSaveDisabled = !title.trim() || isSaving;

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
                    <MaterialCommunityIcons name="tag-edit-outline" size={24} color="#8B5CF6" />
                    <View style={styles.headerTextCol}>
                      <Text style={styles.title}>Editar Etiquetas ID3</Text>
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {track.title}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Acciones de ayuda rápida */}
                <View style={styles.quickHelpersRow}>
                  <TouchableOpacity
                    style={styles.helperBtn}
                    onPress={handleCleanTitle}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="auto-fix" size={16} color="#A78BFA" />
                    <Text style={styles.helperBtnText}>Limpiar formato</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.helperBtn}
                    onPress={handleSwapTitleArtist}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color="#A78BFA" />
                    <Text style={styles.helperBtnText}>Título ⇄ Artista</Text>
                  </TouchableOpacity>
                </View>

                {/* Campos del formulario */}
                <ScrollView
                  style={styles.formContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Título */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Título de la canción</Text>
                      <Text style={styles.requiredBadge}>* Requerido</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Ej: Bohemian Rhapsody"
                      placeholderTextColor="#475569"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Artista */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Artista o intérprete</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={artist}
                      onChangeText={setArtist}
                      placeholder="Ej: Queen"
                      placeholderTextColor="#475569"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Álbum */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Álbum discográfico</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={album}
                      onChangeText={setAlbum}
                      placeholder="Ej: A Night at the Opera"
                      placeholderTextColor="#475569"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Género */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Género musical</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={genre}
                      onChangeText={setGenre}
                      placeholder="Ej: Rock, Pop, Metal..."
                      placeholderTextColor="#475569"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />

                    {/* Chips de géneros frecuentes */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.genreChipsRow}
                    >
                      {COMMON_GENRES.map((g) => {
                        const isSelected = genre.toLowerCase() === g.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={g}
                            style={[styles.genreChip, isSelected && styles.genreChipActive]}
                            onPress={() => handleSelectGenreChip(g)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.genreChipText,
                                isSelected && styles.genreChipTextActive,
                              ]}
                            >
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </ScrollView>

                {/* Botones de acción */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaveDisabled}
                    activeOpacity={0.8}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Guardar</Text>
                      </>
                    )}
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
