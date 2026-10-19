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
    backgroundColor: '#12131A',
    borderWidth: 1,
    borderColor: '#1F202E',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  tabLabel: {
    color: '#8E8F9E',
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#E2E3E9',
    fontWeight: '700',
  },
  tabCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountBadgeActive: {
    backgroundColor: '#8B5CF6',
  },
  tabCountText: {
    color: '#8E8F9E',
    fontSize: 10,
    fontWeight: '700',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },
};

export default tabsStyles;
