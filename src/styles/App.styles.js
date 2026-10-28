import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 99999,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textTertiary,
    marginTop: 15,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default styles;
