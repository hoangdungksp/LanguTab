/**
 * Google sign-in for the web app via Google Identity Services (GIS).
 *
 * The extension uses chrome.identity; the web can't, so we use GIS to get an
 * OAuth access token in the browser and send it as a Bearer token to the
 * worker (which already verifies Google access tokens for the extension).
 */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const TOKEN_KEY = 'lingutab.web.token';

// Minimal shape of the GIS global we use.
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(cfg: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken: () => void };
        };
      };
    };
  }
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Opens the Google consent popup and resolves with an access token. */
export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services chưa tải xong. Thử lại sau giây lát.'));
      return;
    }
    if (!CLIENT_ID) {
      reject(new Error('Thiếu VITE_GOOGLE_CLIENT_ID (xem web/.env.example).'));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      callback: (resp) => {
        if (resp.access_token) {
          sessionStorage.setItem(TOKEN_KEY, resp.access_token);
          resolve(resp.access_token);
        } else {
          reject(new Error(resp.error || 'Đăng nhập thất bại'));
        }
      },
    });
    client.requestAccessToken();
  });
}
