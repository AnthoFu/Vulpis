import { Colors } from '../../constants/colors';

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
    backgroundColor: Colors.bgCard,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderWhiteAlpha04,
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
    backgroundColor: Colors.bgPlaceholder,
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
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  albumRowArtist: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginBottom: 2,
  },
  albumRowSub: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  albumHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.accentAlpha15,
  },
  albumHeroArtworkContainer: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: Colors.bgPlaceholder,
  },
  albumHeroArtworkImage: {
    width: '100%',
    height: '100%',
  },
  albumHeroDetails: {
    flex: 1,
  },
  albumHeroTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  albumHeroArtist: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  albumHeroCount: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginBottom: 10,
  },
  trackNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceWhiteAlpha05,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
  },
};

export default albumsTabStyles;
