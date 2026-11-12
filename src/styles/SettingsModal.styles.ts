import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayAlpha75,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    backgroundColor: Colors.bgModal,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDivider,
    marginBottom: 20,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    color: Colors.textLabel,
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    color: Colors.textDesc,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  subSectionTitle: {
    color: Colors.textSubLabel,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderList,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.accentAlpha15,
    borderColor: Colors.accent,
  },
  pillText: {
    color: Colors.textSubLabel,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.accentLight,
    fontWeight: '700',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dangerAlpha08,
    borderWidth: 1,
    borderColor: Colors.dangerAlpha20,
    marginTop: 8,
  },
  dangerButtonText: {
    color: Colors.dangerLight,
    fontSize: 13,
    fontWeight: '600',
  },
  apiInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.accentAlpha06,
    borderWidth: 1,
    borderColor: Colors.accentAlpha12,
    marginTop: 12,
  },
  apiInfoText: {
    color: Colors.textSubLabel,
    fontSize: 11,
    flex: 1,
  },
  actionTimerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderList,
  },
  actionTimerBtnActive: {
    backgroundColor: Colors.accentAlpha15,
    borderColor: Colors.accent,
  },
  actionTimerBtnText: {
    color: Colors.textSubLabel,
    fontSize: 13,
    fontWeight: '600',
  },
  actionTimerBtnTextActive: {
    color: Colors.accentLight,
    fontWeight: '700',
  },
});

export default styles;
