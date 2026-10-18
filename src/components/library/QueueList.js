import React from 'react';
import useQueueList from '../../hooks/useQueueList';
import TrackOptionsModal from '../modals/TrackOptionsModal';
import PlaylistPickerModal from '../modals/PlaylistPickerModal';

// Subcomponentes modulares de la biblioteca
import TrackItem from './TrackItem';
import LibraryTabs from './LibraryTabs';
import LibrarySearchBar from './LibrarySearchBar';
import GoogleDrivePanel from './GoogleDrivePanel';
import ArtistsTab from './ArtistsTab';
import AlbumsTab from './AlbumsTab';
import PlaylistsTab from './PlaylistsTab';
import SongsTab from './SongsTab';

/**
 * QueueList — Orquestador principal de la biblioteca musical y sus pestañas.
 */
export default function QueueList({
  activeTrack,
  tracks,
  playQueue,
  ListHeaderComponent,
  contentContainerStyle,
  isLoading,
  currentSource,
  onSelectSource,
  onScanLocal,
  onImportMp3,
  onResetLocal,
  hasCustomLocalTracks,
  onAddToQueue,
  onRemoveFromQueue,
  isDriveConnected,
  onConnectDrive,
  onDisconnectDrive,
  onRefreshDrive,
  isDriveLoading,
  googleClientId,
  googleRedirectUri,
  onSelectTrack,
  playlists = [],
  isFavoriteTrack,
  onToggleFavorite,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  onUploadTrackToDrive,
  onUploadLocalTrackToDrive,
  onDeleteDriveTrack,
  onDownloadDriveTrack,
  onDeleteLocalTrack,
}) {
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
  const renderTrackItem = (item, index, contextTracks, showTrackNumber = false) => (
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
  const renderTabs = () => (
    <LibraryTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      trackCount={tracks ? tracks.length : 0}
    />
  );

  // Barra de búsqueda con filtros
  const renderSearchBar = () => (
    <LibrarySearchBar
      searchQuery={searchQuery}
      searchPlaceholder={searchPlaceholder}
      searchFilter={searchFilter}
      searchFilters={searchFilters}
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
    />
  );

  // Panel de Google Drive
  const renderGoogleDrivePanel = () => (
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
  let tabContent = null;
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
        searchFilters={searchFilters}
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
    </>
  );
}
