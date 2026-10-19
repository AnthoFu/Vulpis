/**
 * Estilos para la pestaña de Artistas, avatares, tarjetas de detalle y árbol de canciones por álbum.
 */
export const artistsTabStyles = {
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#161722',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  artistRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
  },
  artistAvatarImage: {
    width: '100%',
    height: '100%',
  },
  artistAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1B2E',
  },
  artistRowDetails: {
    flex: 1,
  },
  artistRowName: {
    color: '#E2E3E9',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  artistRowSub: {
    color: '#8E8F9E',
    fontSize: 12,
  },
  artistHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161722',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  artistHeroAvatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
  },
  artistHeroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  artistHeroDetails: {
    flex: 1,
  },
  artistHeroName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 3,
  },
  artistHeroCount: {
    color: '#8E8F9E',
    fontSize: 12,
    marginBottom: 10,
  },
  artistTreeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  artistTreeSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistTreeSectionTitle: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artistTreeSectionCount: {
    color: '#5F6070',
    fontSize: 12,
  },
};

export default artistsTabStyles;
