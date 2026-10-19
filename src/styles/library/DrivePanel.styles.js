/**
 * Estilos para el panel de Google Drive (estado de conexión, subida, refresco y sincronización).
 */
export const drivePanelStyles = {
  driveHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161722',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2D3C',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  driveInfoText: {
    color: '#8E8F9E',
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
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  driveRefreshBtn: {
    backgroundColor: '#232433',
    borderColor: '#3B3D54',
  },
  driveDisconnectBtn: {
    backgroundColor: '#232433',
    borderColor: '#3B3D54',
  },
  driveConnectCard: {
    backgroundColor: '#161722',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2D3C',
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
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  driveCardTitleCol: {
    flex: 1,
  },
  driveCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  driveCardSubtitle: {
    color: '#8E8F9E',
    fontSize: 12,
    marginTop: 2,
  },
  driveDescriptionText: {
    color: '#8E8F9E',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  devWarningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  devWarningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 18,
  },
  driveConnectBtn: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  driveConnectBtnDisabled: {
    backgroundColor: '#2A2B3D',
    shadowOpacity: 0,
    elevation: 0,
  },
  driveConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
};

export default drivePanelStyles;
