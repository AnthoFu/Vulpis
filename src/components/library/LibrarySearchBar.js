import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';

/**
 * Barra de búsqueda con sugerencias y filtrado multicriterio estilo Odoo.
 */
export default function LibrarySearchBar({
  searchQuery = '',
  searchPlaceholder = 'Buscar...',
  searchFilter = 'all',
  searchFilters = [],
  filterCounts = {},
  isDropdownOpen = false,
  activeTab = 'songs',
  selectedPlaylistId = null,
  displayTracksCount = 0,
  displayArtistsCount = 0,
  displayAlbumsCount = 0,
  onChangeText,
  onClearSearch,
  onToggleDropdown,
  onSelectFilter,
  onCloseDropdown,
}) {
  const isTyping = searchQuery.trim().length > 0;
  const activeFilterObj = searchFilters.find((f) => f.id === searchFilter);
  const showFieldFilter = activeTab === 'songs' || selectedPlaylistId !== null;

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#8B5CF6"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={searchPlaceholder}
          placeholderTextColor="#5F6070"
          value={searchQuery}
          onChangeText={onChangeText}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="never"
        />

        {/* Botón de limpiar texto */}
        {isTyping && (
          <TouchableOpacity
            onPress={onClearSearch}
            style={styles.searchClearBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color="#8E8F9E" />
          </TouchableOpacity>
        )}

        {/* Botón chevron estilo Odoo para abrir/cerrar sugerencias */}
        {isTyping && showFieldFilter && (
          <TouchableOpacity
            onPress={onToggleDropdown}
            style={styles.searchChevronBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isDropdownOpen ? 'menu-up' : 'menu-down'}
              size={22}
              color="#A78BFA"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Menú desplegable contextual estilo Odoo (visible al escribir) */}
      {isTyping && isDropdownOpen && showFieldFilter && (
        <View style={styles.odooDropdownContainer}>
          <View style={styles.odooDropdownHeader}>
            <Text style={styles.odooDropdownHeaderText}>Filtrar búsqueda por campo</Text>
            <TouchableOpacity onPress={onCloseDropdown} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={16} color="#8E8F9E" />
            </TouchableOpacity>
          </View>

          {searchFilters.map((filter) => {
            const isActive = searchFilter === filter.id;
            const count = filterCounts[filter.id] ?? 0;

            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.odooDropdownItem,
                  isActive && styles.odooDropdownItemActive,
                ]}
                onPress={() => onSelectFilter && onSelectFilter(filter.id)}
                activeOpacity={0.7}
              >
                <View style={styles.odooDropdownItemLeft}>
                  <MaterialCommunityIcons
                    name={filter.icon}
                    size={18}
                    color={isActive ? '#A78BFA' : '#8E8F9E'}
                  />
                  <Text style={styles.odooDropdownItemText} numberOfLines={1}>
                    Buscar <Text style={styles.odooDropdownFieldText}>{filter.label}</Text> para:{' '}
                    <Text style={styles.odooDropdownQueryText}>"{searchQuery.trim()}"</Text>
                  </Text>
                </View>

                <View style={styles.odooDropdownItemRight}>
                  <View
                    style={[
                      styles.odooCountBadge,
                      isActive && styles.odooCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.odooCountText,
                        isActive && styles.odooCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialCommunityIcons name="check" size={16} color="#A78BFA" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Fila compacta de filtro activo cuando el dropdown está colapsado */}
      {isTyping && !isDropdownOpen && showFieldFilter && (
        <View style={styles.activeFilterRow}>
          <TouchableOpacity
            style={styles.activeFilterPill}
            onPress={onToggleDropdown}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeFilterObj?.icon || 'filter-variant'}
              size={14}
              color="#A78BFA"
            />
            <Text style={styles.activeFilterPillText}>
              {activeFilterObj?.label || 'Filtro'}: "{searchQuery.trim()}" (
              {filterCounts[searchFilter] ?? displayTracksCount})
            </Text>
            <MaterialCommunityIcons name="menu-down" size={16} color="#A78BFA" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onClearSearch} activeOpacity={0.7}>
            <Text style={styles.searchResultsClearText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Información general para pestañas de artistas/álbumes */}
      {isTyping &&
        (activeTab === 'artists' ||
          activeTab === 'albums' ||
          (activeTab === 'playlists' && !selectedPlaylistId)) && (
          <View style={styles.searchResultsInfoRow}>
            <Text style={styles.searchResultsInfoText}>
              {activeTab === 'artists' &&
                `${displayArtistsCount} ${displayArtistsCount === 1 ? 'artista encontrado' : 'artistas encontrados'}`}
              {activeTab === 'albums' &&
                `${displayAlbumsCount} ${displayAlbumsCount === 1 ? 'álbum encontrado' : 'álbumes encontrados'}`}
              {activeTab === 'playlists' &&
                `Filtrando playlists por "${searchQuery.trim()}"`}
            </Text>
            <TouchableOpacity onPress={onClearSearch} activeOpacity={0.7}>
              <Text style={styles.searchResultsClearText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
}
