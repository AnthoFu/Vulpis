import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Track } from '../../models/Track';
import { Colors } from '../../constants/colors';
import styles from '../../styles/ArtworkPickerModal.styles';
import {
  AlbumArtCandidate,
  searchAlbumArtCandidates,
  downloadAndCacheArtwork,
  pickLocalArtwork,
} from '../../services/artwork/albumArtService';

export interface ArtworkPickerModalProps {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
  onSelectArtwork: (track: Track, newArtworkUrl: string) => Promise<boolean | void> | boolean | void;
}

/**
 * Modal interactivo para buscar, previsualizar y descargar carátulas en alta resolución
 * desde fuentes abiertas (iTunes, Deezer, Cover Art Archive) o seleccionarlas localmente.
 */
export default function ArtworkPickerModal({
  visible,
  track,
  onClose,
  onSelectArtwork,
}: ArtworkPickerModalProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [candidates, setCandidates] = useState<AlbumArtCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AlbumArtCandidate | null>(null);

  // Ejecuta la búsqueda de candidatos
  const handleSearch = useCallback(async (queryToSearch: string) => {
    const cleanQ = queryToSearch.trim();
    if (!cleanQ) return;

    setIsLoading(true);
    setSelectedCandidate(null);
    try {
      const results = await searchAlbumArtCandidates(cleanQ, 16);
      setCandidates(results);
    } catch (err) {
      console.error('[ArtworkPickerModal] Error buscando carátulas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Al abrirse con una pista válida, inicializa la consulta y busca automáticamente
  useEffect(() => {
    if (visible && track) {
      const defaultQuery = [
        track.artist && track.artist !== 'Artista desconocido' ? track.artist : '',
        track.album || track.title || '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const initialQ = defaultQuery || track.title || '';
      setSearchQuery(initialQ);
      if (initialQ) {
        handleSearch(initialQ);
      } else {
        setCandidates([]);
      }
    } else {
      setCandidates([]);
      setSelectedCandidate(null);
      setIsLoading(false);
      setIsDownloading(false);
    }
  }, [visible, track, handleSearch]);

  // Aplica la carátula seleccionada descargándola y guardándola en la caché
  const handleApplyCandidate = async (candidateToApply: AlbumArtCandidate) => {
    if (!track) return;

    setIsDownloading(true);
    try {
      const localArtUri = await downloadAndCacheArtwork(
        candidateToApply.fullUrl,
        track.mediaId
      );

      if (localArtUri) {
        await onSelectArtwork(track, localArtUri);
        onClose();
      } else {
        Alert.alert('Error', 'No se pudo descargar la carátula seleccionada.');
      }
    } catch (err) {
      console.error('[ArtworkPickerModal] Error aplicando carátula:', err);
      Alert.alert('Error', 'Ocurrió un fallo al procesar la carátula.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Permite al usuario elegir una imagen directamente de su dispositivo
  const handlePickFromDevice = async () => {
    if (!track) return;

    setIsDownloading(true);
    try {
      const localUri = await pickLocalArtwork(track.mediaId);
      if (localUri) {
        await onSelectArtwork(track, localUri);
        onClose();
      }
    } catch (err) {
      console.error('[ArtworkPickerModal] Error eligiendo imagen local:', err);
      Alert.alert('Error', 'No se pudo cargar la imagen seleccionada.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!visible || !track) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="image-search-outline" size={24} color={Colors.accentLight} />
              <View style={styles.headerTextCol}>
                <Text style={styles.title} numberOfLines={1}>Buscar Carátula</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {track.title} • {track.artist}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Barra de búsqueda interactiva */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Artista, álbum o canción..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(searchQuery)}
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => handleSearch(searchQuery)}
              disabled={isLoading}
            >
              <Text style={styles.searchBtnText}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {/* Botón rápido para elegir archivo local */}
          <TouchableOpacity
            style={styles.pickLocalBtn}
            onPress={handlePickFromDevice}
            disabled={isDownloading}
          >
            <Ionicons name="folder-open-outline" size={18} color={Colors.accentLight} />
            <Text style={styles.pickLocalBtnText}>Elegir imagen de mi dispositivo</Text>
          </TouchableOpacity>

          {/* Contenido / Cuadrícula de carátulas */}
          <View style={styles.gridContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.loadingText}>Buscando en servicios abiertos...</Text>
              </View>
            ) : candidates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="image-off-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySubtitle}>
                  No encontramos carátulas para "{searchQuery}". Intentá buscar por nombre del álbum o artista.
                </Text>
              </View>
            ) : (
              <FlatList
                data={candidates}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedCandidate?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.candidateCard,
                        isSelected && styles.candidateCardSelected,
                      ]}
                      onPress={() => setSelectedCandidate(item)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={styles.candidateImage}
                        resizeMode="cover"
                      />
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={16} color={Colors.white} />
                        </View>
                      )}
                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateTitle} numberOfLines={1}>
                          {item.album || item.title || 'Álbum'}
                        </Text>
                        <Text style={styles.candidateArtist} numberOfLines={1}>
                          {item.artist || 'Artista'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Pie de modal con acciones */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isDownloading}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.applyBtn,
                (!selectedCandidate || isDownloading) && styles.applyBtnDisabled,
              ]}
              onPress={() => {
                if (selectedCandidate) {
                  handleApplyCandidate(selectedCandidate);
                }
              }}
              disabled={!selectedCandidate || isDownloading}
            >
              {isDownloading ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.applyBtnText}>Descargando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                  <Text style={styles.applyBtnText}>Aplicar Carátula</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
