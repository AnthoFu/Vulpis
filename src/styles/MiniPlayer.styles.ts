import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden', // Para recortar correctamente las esquinas de la barra de progreso superior
  },
  progressBackground: {
    height: 2,
    width: '100%',
    backgroundColor: Colors.bgMid,
  },
  progressActive: {
    height: 2,
    backgroundColor: Colors.accent,
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
    backgroundColor: Colors.bgMid,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: Colors.textTertiary,
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
