import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayAlpha78,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: Colors.bgModal,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentAlpha12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceWhiteAlpha05,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDivider,
    marginVertical: 12,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  // Switch principal de encendido
  powerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  powerBannerActive: {
    borderColor: Colors.accentAlpha30,
    backgroundColor: Colors.accentAlpha06,
  },
  powerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  powerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  powerDescription: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  // Sección de presets
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: Colors.textSubLabel,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  presetInfoBadge: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },
  presetsScrollView: {
    marginBottom: 8,
  },
  presetsContentContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  presetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  presetPillActive: {
    backgroundColor: Colors.accentAlpha20,
    borderColor: Colors.accent,
  },
  presetPillText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  presetPillTextActive: {
    color: Colors.accentLight,
    fontWeight: '700',
  },
  presetDescriptionText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  // Bandas individuales
  bandsWrapper: {
    gap: 12,
    marginBottom: 16,
  },
  bandCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  bandCardDisabled: {
    opacity: 0.45,
  },
  bandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bandLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bandFreq: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  bandSubLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  gainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.surfaceWhiteAlpha08,
    borderWidth: 1,
    borderColor: Colors.borderWhiteAlpha08,
  },
  gainBadgeBoost: {
    backgroundColor: Colors.accentAlpha18,
    borderColor: Colors.accentAlpha30,
  },
  gainBadgeCut: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.30)',
  },
  gainText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  gainTextBoost: {
    color: Colors.accentLight,
  },
  gainTextCut: {
    color: '#F87171',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLimitText: {
    color: Colors.textMuted,
    fontSize: 10,
    width: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  slider: {
    flex: 1,
    height: 36,
  },
  // Refuerzo de graves (Bass Boost)
  bassBoostCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  bassBoostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bassBoostTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bassBoostTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  systemEqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceWhiteAlpha05,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  systemEqButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Pie y acciones
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDivider,
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceWhiteAlpha05,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  resetButtonText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default styles;
