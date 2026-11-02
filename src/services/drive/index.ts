/**
 * Barrel export del subsistema de servicios de Google Drive en TypeScript.
 */

export {
  getGoogleConfig,
  saveGoogleConfig,
  getStoredToken,
  clearToken,
  clearAllCredentials,
  signInWithGoogle,
} from './driveAuth';
export type { GoogleOAuthConfig } from './driveAuth';

export {
  getOrCreateVulpisFolder,
  fetchDriveMp3Files,
  getDriveRedirectUrl,
  mapDriveFileToTrack,
  uploadTrackToDrive,
  deleteTrackFromDrive,
} from './driveApi';
export type { DriveFile, UploadTrackResult } from './driveApi';

export {
  downloadDriveFile,
  saveDriveTrackToDevice,
} from './driveDownload';
export type { SaveDriveTrackParams } from './driveDownload';
