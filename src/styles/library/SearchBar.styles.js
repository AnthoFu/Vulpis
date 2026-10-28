import { Colors } from '../../constants/colors';

/**
 * Estilos para la barra de búsqueda y el menú desplegable estilo Odoo en la biblioteca.
 */
export const searchBarStyles = {
  searchSection: {
    marginTop: 12,
    marginBottom: 16,
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    height: '100%',
  },
  searchClearBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  searchChevronBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  odooDropdownContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.bgElevated,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  odooDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceWhiteAlpha02,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderWhiteAlpha04,
  },
  odooDropdownHeaderText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  odooDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderWhiteAlpha03,
  },
  odooDropdownItemActive: {
    backgroundColor: Colors.accentAlpha12,
  },
  odooDropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  odooDropdownItemText: {
    color: Colors.textDropdown,
    fontSize: 13,
    flex: 1,
  },
  odooDropdownFieldText: {
    color: Colors.white,
    fontWeight: '700',
  },
  odooDropdownQueryText: {
    color: Colors.accentLight,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  odooDropdownItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  odooCountBadge: {
    backgroundColor: Colors.surfaceWhiteAlpha06,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  odooCountBadgeActive: {
    backgroundColor: Colors.accent,
  },
  odooCountText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
  },
  odooCountTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentAlpha14,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 6,
  },
  activeFilterPillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipsContainer: {
    marginTop: 10,
    marginBottom: 2,
  },
  filterChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: Colors.accentAlpha16,
    borderColor: Colors.accent,
  },
  filterChipText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  searchResultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  searchResultsInfoText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  searchResultsClearText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '700',
  },
};

export default searchBarStyles;
