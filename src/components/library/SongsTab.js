import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';

/**
 * Pestaña principal de Canciones (Listado general de la biblioteca musical).
 */
export default function SongsTab({
  displayTracks = [],
  tracks = [],
  isLoading = false,
  currentSource = 'local',
  isDriveConnected = false,
  searchQuery = '',
  searchFilter = 'all',
  searchFilters = [],
  contentContainerStyle,
  ListHeaderComponent,
  renderGoogleDrivePanel,
  renderSearchBar,
  renderTabs,
  renderTrackItem,
  onClearSearch,
}) {
  const listData = isLoading ? [] : displayTracks;
  const activeFilterObj = searchFilters.find((f) => f.id === searchFilter);

  return (
    <FlatList
      data={listData}
      keyExtractor={(item, index) => `${item.mediaId}-${index}`}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}

          {/* Panel de Google Drive */}
          {currentSource === 'private' && renderGoogleDrivePanel && renderGoogleDrivePanel()}

          {/* Buscador y chips de filtro */}
          {(currentSource === 'local' || (currentSource === 'private' && isDriveConnected)) &&
            renderSearchBar &&
            renderSearchBar()}

          {/* Selector de pestañas */}
          {renderTabs && renderTabs()}

          {/* Indicador de carga */}
          {isLoading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Buscando pistas de audio...</Text>
            </View>
          )}

          {/* Estado vacío */}
          {!isLoading && displayTracks.length === 0 && (
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons
                  name={searchQuery ? 'text-search' : 'music-off'}
                  size={32}
                  color="#A78BFA"
                />
              </View>
              <Text style={styles.emptyText}>
                {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No se encontraron canciones'}
              </Text>
              {searchQuery ? (
                <>
                  <Text style={styles.emptySubText}>
                    No se encontraron canciones que coincidan con el filtro "
                    {activeFilterObj?.label || 'Todos'}".
                  </Text>
                  <TouchableOpacity
                    onPress={onClearSearch}
                    style={styles.clearSearchBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearSearchBtnText}>Mostrar todas las canciones</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {currentSource === 'local' && (
                    <Text style={styles.emptySubText}>
                      Usa "Escanear Audio" o "Importar MP3" para cargar música local.
                    </Text>
                  )}
                  {currentSource === 'private' && isDriveConnected && (
                    <Text style={styles.emptySubText}>
                      No se encontraron archivos .mp3 en tu Google Drive.
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
        </>
      }
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => renderTrackItem && renderTrackItem(item, index, tracks)}
    />
  );
}
