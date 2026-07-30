import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2D3C',
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 2,
  },
});

export default styles;
