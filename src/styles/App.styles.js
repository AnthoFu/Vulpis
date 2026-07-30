import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 99999,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8F9E',
    marginTop: 15,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default styles;
