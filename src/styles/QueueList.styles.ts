import { StyleSheet } from 'react-native';
import tabsStyles from './library/Tabs.styles';
import searchBarStyles from './library/SearchBar.styles';
import trackItemStyles from './library/TrackItem.styles';
import drivePanelStyles from './library/DrivePanel.styles';
import playlistsTabStyles from './library/PlaylistsTab.styles';
import libraryModalsStyles from './library/LibraryModals.styles';
import artistsTabStyles from './library/ArtistsTab.styles';
import albumsTabStyles from './library/AlbumsTab.styles';

/**
 * Hoja de estilos principal unificada para la sección de biblioteca y listas.
 * Compone y re-exporta estilos modulares organizados por dominio.
 */
const styles = StyleSheet.create({
  ...tabsStyles,
  ...searchBarStyles,
  ...trackItemStyles,
  ...drivePanelStyles,
  ...playlistsTabStyles,
  ...libraryModalsStyles,
  ...artistsTabStyles,
  ...albumsTabStyles,
});

export {
  tabsStyles,
  searchBarStyles,
  trackItemStyles,
  drivePanelStyles,
  playlistsTabStyles,
  libraryModalsStyles,
  artistsTabStyles,
  albumsTabStyles,
};

export default styles;
