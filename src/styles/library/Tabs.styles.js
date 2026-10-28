import { Colors } from '../../constants/colors';

/**
 * Estilos para los botones y barra de pestañas de la biblioteca (Canciones, Artistas, Álbumes, Playlists).
 */
export const tabsStyles = {
  tabsContainer: {
    marginTop: 10,
    marginBottom: 12,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabButtonActive: {
    backgroundColor: Colors.accentAlpha15,
    borderColor: Colors.accent,
  },
  tabLabel: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  tabCountBadge: {
    backgroundColor: Colors.surfaceWhiteAlpha08,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountBadgeActive: {
    backgroundColor: Colors.accent,
  },
  tabCountText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
  },
  tabCountTextActive: {
    color: Colors.white,
  },
};

export default tabsStyles;
