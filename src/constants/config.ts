/**
 * Configuración global para Google OAuth y servicios de nube de Vulpis.
 */

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
}

const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const clientIdPrefix = clientId.split('.')[0] || '';

export const GOOGLE_OAUTH_CONFIG: GoogleOAuthConfig = {
  // Client ID cargado desde las variables de entorno (.env)
  clientId: clientId,

  // URI de redirección predeterminado generado dinámicamente
  redirectUri: clientIdPrefix ? `com.googleusercontent.apps.${clientIdPrefix}:/oauth-redirect` : '',
};
