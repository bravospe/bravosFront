/**
 * Cookie helper utilities to handle domain switching issues
 */

/**
 * Clear all cookies related to authentication
 * Useful when switching between localhost and IP address
 */
export const clearAuthCookies = () => {
  const cookies = ['XSRF-TOKEN', 'bravos_session', 'laravel_session'];
  
  cookies.forEach(cookieName => {
    // Clear for current domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Clear for .localhost
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost`;
    
    // Clear for IP addresses (common local IPs)
    const ipMatch = window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/);
    if (ipMatch) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    }
  });
};

/**
 * Get the current domain (localhost or IP)
 */
export const getCurrentDomain = (): string => {
  return window.location.hostname;
};

/**
 * Get the stored domain from last session
 */
export const getStoredDomain = (): string | null => {
  return localStorage.getItem('lastUsedDomain');
};

/**
 * Store the current domain
 */
export const storeCurrentDomain = () => {
  localStorage.setItem('lastUsedDomain', getCurrentDomain());
};

/**
 * Check if domain has changed since last session
 */
export const hasDomainChanged = (): boolean => {
  const stored = getStoredDomain();
  const current = getCurrentDomain();
  
  if (!stored) {
    storeCurrentDomain();
    return false;
  }
  
  return stored !== current;
};

/**
 * Handle domain change - clear cookies if domain changed
 */
export const handleDomainChange = () => {
  if (hasDomainChanged()) {
    console.log('Domain changed, clearing old cookies...');
    clearAuthCookies();
    storeCurrentDomain();
  }
};
