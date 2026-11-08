import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayAlpha80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: Colors.bgModal,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textDesc,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDivider,
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.textSubLabel,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderList,
    borderRadius: 12,
    color: Colors.textLabel,
    fontSize: 14,
    padding: 14,
    minHeight: 180,
    maxHeight: 280,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderList,
  },
  secondaryButtonText: {
    color: Colors.textSubLabel,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  infoFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: Colors.textDesc,
    fontSize: 11,
    flex: 1,
  },
});

export default styles;
