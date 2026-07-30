import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: '#161722',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2D3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden', // Para recortar correctamente las esquinas de la barra de progreso superior
  },
  progressBackground: {
    height: 2,
    width: '100%',
    backgroundColor: '#232433',
  },
  progressActive: {
    height: 2,
    backgroundColor: '#8B5CF6',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#232433',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: '#8E8F9E',
    fontSize: 12,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;
