import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4, // Ajustar ligeramente ya que el deslizador tiene un relleno incorporado
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#8E8F9E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default styles;
