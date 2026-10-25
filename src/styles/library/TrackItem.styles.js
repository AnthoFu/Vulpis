import { Colors } from '../../constants/colors';

/**
 * Estilos para las filas de pistas individuales, acciones locales y estados vacíos de la biblioteca.
 */
export const trackItemStyles = {
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  localActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentAlpha08,
    borderWidth: 1,
    borderColor: Colors.accentAlpha20,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    flex: 0,
    width: 44,
    borderColor: Colors.dangerAlpha20,
    backgroundColor: Colors.dangerAlpha08,
  },
  queueHeader: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  itemMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addToQueueButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueItemActive: {
    backgroundColor: Colors.surfaceWhiteAlpha03,
    borderRadius: 8,
  },
  queueItemDisabled: {
    opacity: 0.5,
  },
  queueArtwork: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginRight: 14,
  },
  queueDetails: {
    flex: 1,
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  queueTitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  queueTextActive: {
    color: Colors.accentLight,
  },
  queueArtist: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
  queueSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  genreBadge: {
    backgroundColor: Colors.accentAlpha12,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'center',
  },
  genreBadgeText: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  clearSearchBtn: {
    marginTop: 14,
    backgroundColor: Colors.accentAlpha12,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  clearSearchBtnText: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '700',
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentAlpha12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accentAlpha30,
    marginRight: 6,
  },
  playingIndicatorText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingWrapper: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  emptyWrapper: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentAlpha05,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.accentAlpha10,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
};

export default trackItemStyles;
