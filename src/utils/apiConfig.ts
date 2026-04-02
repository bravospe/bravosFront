/**
 * Get the API URL based on environment configuration
 */
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.bravos.pe/api/v1';
};

/**
 * Get the base URL (without /api/v1) for Sanctum
 */
export const getBaseUrl = (): string => {
  return getApiUrl().replace('/api/v1', '');
};
