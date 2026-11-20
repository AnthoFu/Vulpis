import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export const batchActionBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#1E1A34',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentAlpha30,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentAlpha12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toggleAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.accentAlpha12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
  },
  toggleAllText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  actionText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
  actionTextDanger: {
    color: '#F87171',
  },
});

export default batchActionBarStyles;
