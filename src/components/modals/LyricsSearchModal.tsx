import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/LyricsSearchModal.styles';
import { LyricCandidate, searchLrclibManual } from '../../services/lyrics';
import { formatDuration } from '../library/TrackItem';

export interface LyricsSearchModalProps {
  visible: boolean;
  onClose: () => void;
  trackTitle?: string;
  trackArtist?: string;
  trackDuration?: number;
  onSelectCandidate: (candidate: LyricCandidate) => Promise<boolean> | void;
}

/**
 * Modal interactivo para buscar, previsualizar y seleccionar manualmente
 * letras de canciones en la API pública de LRCLIB.
 */
export default function LyricsSearchModal({
  visible,
  onClose,
  trackTitle = '',
  trackArtist = '',
  trackDuration = 0,
  onSelectCandidate,
}: LyricsSearchModalProps): React.JSX.Element | null {
  const [query, setQuery] = useState<string>('');
  const [candidates, setCandidates] = useState<LyricCandidate[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [previewId, setPreviewId] = useState<number | string | null>(null);

  // Inicializar consulta y realizar búsqueda automática al abrir
  useEffect(() => {
    if (visible) {
      const initialQuery = `${trackTitle} ${trackArtist && trackArtist !== 'Desconocido' ? trackArtist : ''}`.trim();
      setQuery(initialQuery);
      setPreviewId(null);

      if (initialQuery) {
        performSearch(initialQuery);
      } else {
        setCandidates([]);
        setHasSearched(false);
      }
    }
  }, [visible, trackTitle, trackArtist]);

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setHasSearched(true);
    setPreviewId(null);

    try {
      const results = await searchLrclibManual(trimmed);
      setCandidates(results);
    } catch (e) {
      console.error('[LyricsSearchModal] Error al buscar candidatos:', e);
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleApply = async (candidate: LyricCandidate): Promise<void> => {
    const hasLyrics = Boolean(candidate.syncedLyrics || candidate.plainLyrics);
    if (!hasLyrics && candidate.instrumental) {
      Alert.alert(
        'Pista Instrumental',
        'Esta pista está marcada como instrumental en LRCLIB y no contiene letras.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      await onSelectCandidate(candidate);
      onClose();
    } catch (e) {
      console.error('[LyricsSearchModal] Error al aplicar candidato:', e);
    }
  };

  const togglePreview = (id: number | string | undefined): void => {
    if (!id) return;
    setPreviewId((prev) => (prev === id ? null : id));
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
                    <MaterialCommunityIcons name="text-search" size={24} color="#8B5CF6" />
                    <View style={styles.headerTextCol}>
                      <Text style={styles.title}>Buscar en LRCLIB</Text>
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {trackTitle} • {trackArtist}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Barra de búsqueda interactiva */}
                <View style={styles.searchBarRow}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Título, artista o palabras clave..."
                    placeholderTextColor="#475569"
                    returnKeyType="search"
                    onSubmitEditing={() => performSearch(query)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setQuery('')}
                      style={styles.clearQueryBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="close-circle" size={18} color="#64748B" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.searchSubmitBtn}
                    onPress={() => performSearch(query)}
                    disabled={isSearching || !query.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.searchSubmitBtnText}>Buscar</Text>
                  </TouchableOpacity>
                </View>

                {/* Contador de resultados */}
                {hasSearched && !isSearching && candidates.length > 0 && (
                  <Text style={styles.resultsCountText}>
                    {candidates.length} {candidates.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}:
                  </Text>
                )}

                {/* Contenido principal: Loading, Lista o Estado Vacío */}
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={styles.loadingText}>Consultando catálogo de LRCLIB...</Text>
                  </View>
                ) : candidates.length > 0 ? (
                  <FlatList
                    data={candidates}
                    keyExtractor={(item, index) => `${item.id || index}-${item.trackName}`}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                      const itemKey = item.id || index;
                      const isPreviewOpen = previewId === itemKey;
                      const hasSynced = Boolean(item.syncedLyrics);
                      const hasPlain = Boolean(item.plainLyrics);
                      const durationStr = item.duration ? formatDuration(item.duration) : null;

                      let durationDiffText: string | null = null;
                      if (trackDuration > 0 && item.duration && item.duration > 0) {
                        const diff = Math.round(item.duration - trackDuration);
                        if (Math.abs(diff) <= 2) {
                          durationDiffText = 'Duración exacta';
                        } else if (diff > 0) {
                          durationDiffText = `+${diff}s`;
                        } else {
                          durationDiffText = `${diff}s`;
                        }
                      }

                      const previewContent = item.syncedLyrics || item.plainLyrics || 'Sin letra disponible';

                      return (
                        <View style={[styles.candidateCard, isPreviewOpen && styles.candidateCardActive]}>
                          <View style={styles.candidateMainRow}>
                            <View style={styles.candidateInfo}>
                              <Text style={styles.candidateTrackName} numberOfLines={1}>
                                {item.trackName}
                              </Text>
                              <Text style={styles.candidateMetaText} numberOfLines={1}>
                                {item.artistName}
                                {item.albumName ? ` • ${item.albumName}` : ''}
                              </Text>
                            </View>
                          </View>

                          {/* Fila de insignias informativas */}
                          <View style={styles.badgeRow}>
                            {hasSynced && (
                              <View style={styles.syncedBadge}>
                                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#A78BFA" />
                                <Text style={styles.syncedBadgeText}>Sincronizada (.lrc)</Text>
                              </View>
                            )}
                            {!hasSynced && hasPlain && (
                              <View style={styles.plainBadge}>
                                <MaterialCommunityIcons name="text" size={11} color="#38BDF8" />
                                <Text style={styles.plainBadgeText}>Texto plano</Text>
                              </View>
                            )}
                            {item.instrumental && (
                              <View style={styles.instrumentalBadge}>
                                <Text style={styles.instrumentalBadgeText}>Instrumental</Text>
                              </View>
                            )}
                            {durationStr && (
                              <View style={styles.durationBadge}>
                                <Text style={styles.durationBadgeText}>
                                  {durationStr}
                                  {durationDiffText ? ` (${durationDiffText})` : ''}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Previsualización desplegable de las estrofas */}
                          {isPreviewOpen && (
                            <ScrollView style={styles.previewBox} nestedScrollEnabled={true}>
                              <Text style={styles.previewText} numberOfLines={12}>
                                {previewContent}
                              </Text>
                            </ScrollView>
                          )}

                          {/* Botones de acción */}
                          <View style={styles.candidateActionsRow}>
                            {(hasSynced || hasPlain) && (
                              <TouchableOpacity
                                style={styles.previewBtn}
                                onPress={() => togglePreview(itemKey)}
                                activeOpacity={0.7}
                              >
                                <MaterialCommunityIcons
                                  name={isPreviewOpen ? 'chevron-up' : 'eye-outline'}
                                  size={16}
                                  color="#94A3B8"
                                />
                                <Text style={styles.previewBtnText}>
                                  {isPreviewOpen ? 'Ocultar' : 'Vista previa'}
                                </Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.applyBtn}
                              onPress={() => handleApply(item)}
                              activeOpacity={0.8}
                            >
                              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                              <Text style={styles.applyBtnText}>Aplicar letra</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }}
                  />
                ) : hasSearched ? (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <MaterialCommunityIcons name="magnify-remove-outline" size={32} color="#A78BFA" />
                    </View>
                    <Text style={styles.emptyTitle}>Sin coincidencias en LRCLIB</Text>
                    <Text style={styles.emptySub}>
                      No se encontraron resultados para "{query}". Prueba buscando solo el título de la canción o quitando palabras como "Remastered" o "Live".
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <MaterialCommunityIcons name="text-search" size={32} color="#A78BFA" />
                    </View>
                    <Text style={styles.emptyTitle}>Búsqueda interactiva</Text>
                    <Text style={styles.emptySub}>
                      Ingresa el nombre de la canción o artista arriba para consultar la base de datos de LRCLIB.
                    </Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
