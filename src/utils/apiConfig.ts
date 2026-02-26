/**
 * Get the API URL based on the current hostname
 * This allows the app to work with both localhost and IP addresses
 */
export const getApiUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api/v1'; // Default for SSR/Build
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // If accessing via localhost, use localhost for API too
  if (isLocalhost) {
    return 'http://localhost:8080/api/v1';
  }
  
  // Otherwise, use the current hostname (IP address)
  return `http://${hostname}:8080/api/v1`;
};

/**
 * Get the base URL (without /api/v1) for Sanctum
 */
export const getBaseUrl = (): string => {
  return getApiUrl().replace('/api/v1', '');
};
