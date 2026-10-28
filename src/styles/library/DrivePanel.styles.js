import { Colors } from '../../constants/colors';

/**
 * Estilos para el panel de Google Drive (estado de conexión, subida, refresco y sincronización).
 */
export const drivePanelStyles = {
  driveHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 16,
    marginBottom: 20,
  },
  driveStatusCol: {
    flex: 1,
  },
  driveStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driveStatusText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  driveInfoText: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginLeft: 28,
  },
  driveActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driveActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  driveUploadBtn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentLight,
  },
  driveRefreshBtn: {
    backgroundColor: Colors.bgMid,
    borderColor: Colors.bgElevated,
  },
  driveDisconnectBtn: {
    backgroundColor: Colors.bgMid,
    borderColor: Colors.bgElevated,
  },
  driveConnectCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 20,
    marginBottom: 20,
  },
  driveCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driveIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.accentAlpha12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: Colors.accentAlpha20,
  },
  driveCardTitleCol: {
    flex: 1,
  },
  driveCardTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  driveCardSubtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  driveDescriptionText: {
    color: Colors.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  devWarningBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warningAlpha08,
    borderWidth: 1,
    borderColor: Colors.warningAlpha20,
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  devWarningText: {
    flex: 1,
    color: Colors.warning,
    fontSize: 12,
    lineHeight: 18,
  },
  driveConnectBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  driveConnectBtnDisabled: {
    backgroundColor: Colors.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  driveConnectBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
};

export default drivePanelStyles;
