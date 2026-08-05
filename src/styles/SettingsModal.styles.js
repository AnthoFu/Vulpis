import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1017',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F202E',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1C29',
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
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  subSectionTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#161722',
    borderWidth: 1,
    borderColor: '#262838',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#A78BFA',
    fontWeight: '700',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
  apiInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.12)',
    marginTop: 12,
  },
  apiInfoText: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
  },
});

export default styles;
