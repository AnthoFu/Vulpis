import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import useQueueList from '../../hooks/useQueueList';
import TrackOptionsModal from '../modals/TrackOptionsModal';
import PlaylistPickerModal from '../modals/PlaylistPickerModal';
import SortModal from '../modals/SortModal';

// Subcomponentes modulares de la biblioteca
import TrackItem from './TrackItem';
import LibraryTabs from './LibraryTabs';
import LibrarySearchBar from './LibrarySearchBar';
import GoogleDrivePanel from './GoogleDrivePanel';
import ArtistsTab from './ArtistsTab';
import AlbumsTab from './AlbumsTab';
import PlaylistsTab from './PlaylistsTab';
import SongsTab from './SongsTab';
import { PlayerContext } from '../../context/PlayerContext';
import { Track } from '../../models/Track';
import { Playlist } from '../../models/Playlist';
import { AudioSource } from '../../hooks/useAppController';

export interface QueueListProps {
  activeTrack?: Track | null;
  tracks?: Track[];
  playQueue?: Track[];
  ListHeaderComponent?: React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  currentSource?: AudioSource;
  onSelectSource?: (source: AudioSource) => void;
  onScanLocal?: () => void;
  onImportMp3?: () => void;
  onResetLocal?: () => void;
  hasCustomLocalTracks?: boolean;
  onAddToQueue?: (track: Track) => void;
  onRemoveFromQueue?: (track: Track, index: number) => void;
  isDriveConnected?: boolean;
  onConnectDrive?: (clientId: string, redirectUri: string) => void;
  onDisconnectDrive?: () => void;
  onRefreshDrive?: () => void;
  isDriveLoading?: boolean;
  googleClientId?: string;
  googleRedirectUri?: string;
  onSelectTrack?: (track: Track, index: number, tracks?: Track[]) => Promise<void> | void;
  playlists?: Playlist[];
  isFavoriteTrack?: (mediaId: string) => boolean;
  onToggleFavorite?: (track: Track) => void;
  onCreatePlaylist?: (name: string) => Promise<Playlist | null>;
  onDeletePlaylist?: (playlistId: string) => Promise<void>;
  onAddTrackToPlaylist?: (playlistId: string, track: Track) => Promise<void>;
  onRemoveTrackFromPlaylist?: (playlistId: string, mediaId: string) => Promise<void>;
  onUploadTrackToDrive?: () => void;
  onUploadLocalTrackToDrive?: (track: Track) => void;
  onDeleteDriveTrack?: (track: Track) => void;
  onDownloadDriveTrack?: (track: Track) => void;
  onDeleteLocalTrack?: (track: Track) => void;
}

/**
 * QueueList — Orquestador principal de la biblioteca musical y sus pestañas.
 * Puede recibir propiedades explícitas o consumir automáticamente el `PlayerContext`.
 */
export default function QueueList(props: QueueListProps): React.JSX.Element {
  const player = React.useContext(PlayerContext);

  const activeTrack = props.activeTrack !== undefined ? props.activeTrack : player?.activeTrack;
  const tracks = props.tracks !== undefined ? props.tracks : (player?.tracks || []);
  const playQueue = props.playQueue !== undefined ? props.playQueue : (player?.playQueue || []);
  const ListHeaderComponent = props.ListHeaderComponent;
  const contentContainerStyle = props.contentContainerStyle;
  const isLoading = props.isLoading !== undefined ? props.isLoading : (player?.isSourceChanging || false);
  const currentSource = props.currentSource !== undefined ? props.currentSource : (player?.currentSource || 'local');
  const onSelectSource = props.onSelectSource || player?.handleSourceChange;
  const onScanLocal = props.onScanLocal || player?.handleScanLocal;
  const onImportMp3 = props.onImportMp3 || player?.handleImportMp3;
  const onResetLocal = props.onResetLocal || player?.handleResetLocal;
  const hasCustomLocalTracks = props.hasCustomLocalTracks !== undefined ? props.hasCustomLocalTracks : player?.hasCustomLocalTracks;
  const onAddToQueue = props.onAddToQueue || player?.handleAddToQueue;
  const onRemoveFromQueue = props.onRemoveFromQueue || player?.handleRemoveFromQueue;
  const isDriveConnected = props.isDriveConnected !== undefined ? props.isDriveConnected : (player?.isDriveConnected || false);
  const onConnectDrive = props.onConnectDrive || player?.handleConnectDrive;
  const onDisconnectDrive = props.onDisconnectDrive || player?.handleDisconnectDrive;
  const onRefreshDrive = props.onRefreshDrive || player?.handleRefreshDrive;
  const isDriveLoading = props.isDriveLoading !== undefined ? props.isDriveLoading : (player?.isDriveLoading || false);
  const googleClientId = props.googleClientId !== undefined ? props.googleClientId : player?.googleClientId;
  const googleRedirectUri = props.googleRedirectUri !== undefined ? props.googleRedirectUri : player?.googleRedirectUri;
  const onSelectTrack = props.onSelectTrack || player?.handleSelectTrack;
  const playlists = props.playlists !== undefined ? props.playlists : (player?.playlists || []);
  const isFavoriteTrack = props.isFavoriteTrack || player?.isFavoriteTrack;
  const onToggleFavorite = props.onToggleFavorite || player?.handleToggleFavorite;
  const onCreatePlaylist = props.onCreatePlaylist || player?.handleCreatePlaylist;
  const onDeletePlaylist = props.onDeletePlaylist || player?.handleDeletePlaylist;
  const onAddTrackToPlaylist = props.onAddTrackToPlaylist || player?.handleAddTrackToPlaylist;
  const onRemoveTrackFromPlaylist = props.onRemoveTrackFromPlaylist || player?.handleRemoveTrackFromPlaylist;
  const onUploadTrackToDrive = props.onUploadTrackToDrive || player?.handleUploadTrackToDrive;
  const onUploadLocalTrackToDrive = props.onUploadLocalTrackToDrive || player?.handleUploadLocalTrackToDrive;
  const onDeleteDriveTrack = props.onDeleteDriveTrack || player?.handleDeleteDriveTrack;
  const onDownloadDriveTrack = props.onDownloadDriveTrack || player?.handleDownloadDriveTrack;
  const onDeleteLocalTrack = props.onDeleteLocalTrack || player?.handleDeleteLocalTrack;

  const {
    activeTab,
    handleTabChange,
    tabs,
    artistTree,
    displayArtists,
    selectedArtistId,
    setSelectedArtistId,
    selectedArtist,
    handlePlayArtist,
    albumList,
    displayAlbums,
    selectedAlbumId,
    setSelectedAlbumId,
    selectedAlbum,
    handlePlayAlbum,
    isProcessing,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    searchFilter,
    setSearchFilter,
    handleSelectFilter,
    searchFilters,
    searchPlaceholder,
    handleClearSearch,
    isDropdownOpen,
    setIsDropdownOpen,
    toggleDropdown,
    filterCounts,
    selectedPlaylistId,
    setSelectedPlaylistId,
    showCreateInput,
    setShowCreateInput,
    newPlaylistName,
    setNewPlaylistName,
    selectedTrackForOptions,
    setSelectedTrackForOptions,
    isPlaylistPickerVisible,
    setIsPlaylistPickerVisible,
    inlineNewPlaylistName,
    setInlineNewPlaylistName,
    selectTrack,
    handlePlayPlaylist,
    handleCreateNewPlaylist,
    handleCreateAndAdd,
    displayTracks,
    defaultArtwork,
    sortConfig,
    handleSortChange,
    isSortModalVisible,
    setIsSortModalVisible,
  } = useQueueList({
    tracks,
    playlists,
    currentSource,
    onSelectTrack,
    onCreatePlaylist,
    onAddTrackToPlaylist,
    onSelectSource,
  });

  // Renderizador unificado para filas de canciones
  const renderTrackItem = (item: Track, index: number, contextTracks?: Track[], showTrackNumber = false): React.JSX.Element => (
    <TrackItem
      key={`${item.mediaId}-${index}`}
      item={item}
      index={index}
      contextTracks={contextTracks}
      showTrackNumber={showTrackNumber}
      activeTrack={activeTrack}
      isProcessing={isProcessing}
      defaultArtwork={defaultArtwork}
      onSelectTrack={selectTrack}
      onOpenOptions={setSelectedTrackForOptions}
    />
  );

  // Selector de pestañas superior
  const renderTabs = (): React.JSX.Element => (
    <LibraryTabs
      tabs={tabs as any}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      trackCount={tracks ? tracks.length : 0}
    />
  );

  // Barra de búsqueda con filtros
  const renderSearchBar = (): React.JSX.Element => (
    <LibrarySearchBar
      searchQuery={searchQuery}
      searchPlaceholder={searchPlaceholder}
      searchFilter={searchFilter}
      searchFilters={searchFilters as any}
      filterCounts={filterCounts}
      isDropdownOpen={isDropdownOpen}
      activeTab={activeTab}
      selectedPlaylistId={selectedPlaylistId}
      displayTracksCount={displayTracks.length}
      displayArtistsCount={displayArtists.length}
      displayAlbumsCount={displayAlbums.length}
      onChangeText={handleSearchChange}
      onClearSearch={handleClearSearch}
      onToggleDropdown={toggleDropdown}
      onSelectFilter={handleSelectFilter}
      onCloseDropdown={() => setIsDropdownOpen(false)}
      onOpenSort={() => setIsSortModalVisible(true)}
      currentSortConfig={sortConfig}
    />
  );

  // Panel de Google Drive
  const renderGoogleDrivePanel = (): React.JSX.Element => (
    <GoogleDrivePanel
      isDriveConnected={isDriveConnected}
      isDriveLoading={isDriveLoading}
      isLoading={isLoading}
      googleClientId={googleClientId}
      googleRedirectUri={googleRedirectUri}
      onUploadTrackToDrive={onUploadTrackToDrive}
      onRefreshDrive={onRefreshDrive}
      onDisconnectDrive={onDisconnectDrive}
      onConnectDrive={onConnectDrive}
    />
  );

  // Renderizado condicional según la pestaña activa
  let tabContent: React.JSX.Element | null = null;
  if (activeTab === 'artists') {
    tabContent = (
      <ArtistsTab
        displayArtists={displayArtists}
        selectedArtist={selectedArtist}
        searchQuery={searchQuery}
        onSelectArtist={setSelectedArtistId}
        onPlayArtist={handlePlayArtist}
        onBack={() => setSelectedArtistId(null)}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        renderTabs={renderTabs}
        renderSearchBar={renderSearchBar}
        renderGoogleDrivePanel={renderGoogleDrivePanel}
        renderTrackItem={renderTrackItem}
        currentSource={currentSource}
      />
    );
  } else if (activeTab === 'albums') {
    tabContent = (
      <AlbumsTab
        displayAlbums={displayAlbums}
        selectedAlbum={selectedAlbum}
        searchQuery={searchQuery}
        onSelectAlbum={setSelectedAlbumId}
        onPlayAlbum={handlePlayAlbum}
        onBack={() => setSelectedAlbumId(null)}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        renderTabs={renderTabs}
        renderSearchBar={renderSearchBar}
        renderGoogleDrivePanel={renderGoogleDrivePanel}
        renderTrackItem={renderTrackItem}
        currentSource={currentSource}
      />
    );
  } else if (activeTab === 'playlists') {
    tabContent = (
      <PlaylistsTab
        playlists={playlists}
        selectedPlaylistId={selectedPlaylistId}
        searchQuery={searchQuery}
        searchFilter={searchFilter}
        sortConfig={sortConfig}
        showCreateInput={showCreateInput}
        newPlaylistName={newPlaylistName}
        activeTrack={activeTrack}
        isProcessing={isProcessing}
        defaultArtwork={defaultArtwork}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        renderTabs={renderTabs}
        renderSearchBar={renderSearchBar}
        renderGoogleDrivePanel={renderGoogleDrivePanel}
        onSelectPlaylist={setSelectedPlaylistId}
        onPlayPlaylist={handlePlayPlaylist}
        onBack={() => setSelectedPlaylistId(null)}
        onToggleCreateInput={() => setShowCreateInput(!showCreateInput)}
        onChangeNewPlaylistName={setNewPlaylistName}
        onCreateNewPlaylist={handleCreateNewPlaylist}
        onDeletePlaylist={onDeletePlaylist}
        onRemoveTrackFromPlaylist={onRemoveTrackFromPlaylist}
        onSelectTrack={selectTrack}
        onClearSearch={handleClearSearch}
        currentSource={currentSource}
      />
    );
  } else {
    // Pestaña por defecto: Canciones
    tabContent = (
      <SongsTab
        displayTracks={displayTracks}
        tracks={tracks}
        isLoading={isLoading}
        currentSource={currentSource}
        isDriveConnected={isDriveConnected}
        searchQuery={searchQuery}
        searchFilter={searchFilter}
        searchFilters={searchFilters as any}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        renderGoogleDrivePanel={renderGoogleDrivePanel}
        renderSearchBar={renderSearchBar}
        renderTabs={renderTabs}
        renderTrackItem={renderTrackItem}
        onClearSearch={handleClearSearch}
      />
    );
  }

  return (
    <>
      {tabContent}

      {/* Modal de opciones de canción */}
      <TrackOptionsModal
        visible={selectedTrackForOptions !== null}
        track={selectedTrackForOptions}
        isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
        onToggleFavorite={onToggleFavorite}
        onClose={() => setSelectedTrackForOptions(null)}
        onAddToQueue={onAddToQueue}
        onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
        onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
        onDownloadDriveTrack={onDownloadDriveTrack}
        onDeleteDriveTrack={onDeleteDriveTrack}
        onDeleteLocalTrack={onDeleteLocalTrack}
      />

      {/* Modal de selección de playlist */}
      <PlaylistPickerModal
        visible={isPlaylistPickerVisible}
        playlists={playlists}
        track={selectedTrackForOptions}
        onClose={() => {
          setIsPlaylistPickerVisible(false);
          setSelectedTrackForOptions(null);
        }}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
        inlineNewPlaylistName={inlineNewPlaylistName}
        setInlineNewPlaylistName={setInlineNewPlaylistName}
        handleCreateAndAdd={handleCreateAndAdd}
      />

      {/* Modal de ordenamiento multicriterio */}
      <SortModal
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        currentConfig={sortConfig}
        onSelectConfig={handleSortChange}
      />
    </>
  );
}
