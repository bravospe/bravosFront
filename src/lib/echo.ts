import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';
import { getBaseUrl } from '../utils/apiConfig';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

// Make Pusher globally available
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

// Get Reverb configuration from environment
const REVERB_APP_KEY = process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'bravos-reverb-key';
const REVERB_HOST = process.env.NEXT_PUBLIC_REVERB_HOST || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
const REVERB_PORT = process.env.NEXT_PUBLIC_REVERB_PORT || 6001;
const REVERB_SCHEME = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';

// Store the last token to check for changes
let lastAuthToken: string | undefined;

/**
 * Initialize Laravel Echo with Reverb
 */
export const initializeEcho = (authToken?: string): Echo => {
  if (typeof window === 'undefined') {
    return {} as Echo; // Mock for SSR
  }

  // If Echo instance exists and token hasn't changed, reuse it
  if (window.Echo && lastAuthToken === authToken) {
    return window.Echo;
  }

  // If token changed or no instance, disconnect existing one
  if (window.Echo) {
    window.Echo.disconnect();
  }

  // Update last token
  lastAuthToken = authToken;

  // Detect if we are on a local network or localhost to force HTTP/WS
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
  );

  // Override scheme if local to avoid SSL issues
  const scheme = isLocal ? 'http' : REVERB_SCHEME;
  const useTLS = scheme === 'https';

  const baseUrl = getBaseUrl();

  // Debug Reverb Config
  console.log('🔌 Initializing Echo with Config (Auto-Detected):', {
    SCHEME: scheme,
    HOST: REVERB_HOST,
    PORT: REVERB_PORT,
    APP_KEY: REVERB_APP_KEY,
    forceTLS: useTLS,
    isLocal,
    location: typeof window !== 'undefined' ? window.location.hostname : 'SSR'
  });

  const echo = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: useTLS,
    enabledTransports: ['ws', 'wss'],
    // Use API authentication (Bearer Token) instead of Cookie/Session auth
    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : '',
        Accept: 'application/json',
      },
    },
  });

  window.Echo = echo;

  return echo;
};

/**
 * Disconnect from Echo
 */
export const disconnectEcho = (): void => {
  if (typeof window !== 'undefined' && window.Echo) {
    window.Echo.disconnect();
  }
};

/**
 * Get the current Echo instance
 */
export const getEcho = (): Echo | null => {
  if (typeof window === 'undefined') return null;
  return window.Echo || null;
};

export default initializeEcho;
