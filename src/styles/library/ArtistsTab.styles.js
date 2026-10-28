import { Colors } from '../../constants/colors';

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
    backgroundColor: Colors.bgCard,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderWhiteAlpha04,
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
    backgroundColor: Colors.bgPlaceholder,
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
    backgroundColor: Colors.bgPlaceholder,
  },
  artistRowDetails: {
    flex: 1,
  },
  artistRowName: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  artistRowSub: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  artistHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.accentAlpha15,
  },
  artistHeroAvatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: Colors.bgPlaceholder,
  },
  artistHeroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  artistHeroDetails: {
    flex: 1,
  },
  artistHeroName: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 3,
  },
  artistHeroCount: {
    color: Colors.textTertiary,
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
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artistTreeSectionCount: {
    color: Colors.textMuted,
    fontSize: 12,
  },
};

export default artistsTabStyles;
