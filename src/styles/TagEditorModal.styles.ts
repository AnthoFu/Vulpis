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
    maxWidth: 440,
    maxHeight: '90%',
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
    marginBottom: 14,
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
    marginBottom: 14,
  },
  quickHelpersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  helperBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.accentAlpha08,
    borderWidth: 1,
    borderColor: Colors.accentAlpha20,
  },
  helperBtnText: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
  },
  formContent: {
    maxHeight: 340,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    color: Colors.textSubLabel,
    fontSize: 12,
    fontWeight: '600',
  },
  requiredBadge: {
    color: Colors.accent,
    fontSize: 12,
  },
  textInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderList,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textLabel,
    fontSize: 14,
    height: 42,
  },
  genreChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  genreChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreChipActive: {
    backgroundColor: Colors.accentAlpha15,
    borderColor: Colors.accentAlpha50,
  },
  genreChipText: {
    color: Colors.textDesc,
    fontSize: 11,
    fontWeight: '600',
  },
  genreChipTextActive: {
    color: Colors.accentLight,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDivider,
    paddingTop: 14,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderList,
  },
  cancelButtonText: {
    color: Colors.textSubLabel,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.bgElevated,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default styles;
