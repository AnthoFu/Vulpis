import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

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
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentAlpha15,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
  },
});

export default styles;
