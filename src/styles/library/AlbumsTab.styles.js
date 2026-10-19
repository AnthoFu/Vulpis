/**
 * Estilos para la pestaña de Álbumes, cuadrículas, tarjetas destacadas (Hero Card) e insignias de número de pista.
 */
export const albumsTabStyles = {
  albumRow: {
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
  albumRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArtworkContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
  },
  albumArtworkImage: {
    width: '100%',
    height: '100%',
  },
  albumArtworkFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumRowDetails: {
    flex: 1,
  },
  albumRowTitle: {
    color: '#E2E3E9',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  albumRowArtist: {
    color: '#8E8F9E',
    fontSize: 12,
    marginBottom: 2,
  },
  albumRowSub: {
    color: '#5F6070',
    fontSize: 11,
  },
  albumHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161722',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  albumHeroArtworkContainer: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
  },
  albumHeroArtworkImage: {
    width: '100%',
    height: '100%',
  },
  albumHeroDetails: {
    flex: 1,
  },
  albumHeroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  albumHeroArtist: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  albumHeroCount: {
    color: '#8E8F9E',
    fontSize: 12,
    marginBottom: 10,
  },
  trackNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    color: '#8E8F9E',
    fontSize: 11,
    fontWeight: '700',
  },
};

export default albumsTabStyles;
