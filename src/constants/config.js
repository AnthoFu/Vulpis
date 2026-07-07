/**
 * Configuración global para el desarrollador de Vulpis.
 * 
 * Para habilitar Google Drive, debes:
 * 1. Ir a Google Cloud Console (https://console.cloud.google.com/)
 * 2. Crear un proyecto y habilitar la Google Drive API.
 * 3. Crear credenciales de "ID de cliente de OAuth".
 *    - En Android: Usa el package name "com.anthofu.Vulpis".
 *    - En iOS: Usa el bundle ID "com.anthofu.Vulpis".
 * 4. Añadir el Redirect URI: "vulpis://oauth-redirect".
 * 5. Copiar el Client ID resultante aquí abajo.
 * 
 * Una vez configurado aquí por ti (desarrollador), los usuarios finales de la app
 * tendrán una experiencia de "un solo clic" sin tener que configurar nada.
 */
const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const clientIdPrefix = clientId.split('.')[0] || '';

export const GOOGLE_OAUTH_CONFIG = {
  // Client ID cargado desde las variables de entorno (.env)
  clientId: clientId,
  
  // URI de redirección predeterminado generado dinámicamente
  redirectUri: clientIdPrefix ? `com.googleusercontent.apps.${clientIdPrefix}:/oauth-redirect` : '',
};
